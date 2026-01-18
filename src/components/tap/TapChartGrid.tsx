'use client';

import { memo, useRef, useEffect, useCallback, useState } from 'react';
import { GridBox, TapBet, PricePoint } from '@/lib/tap/types';

interface TapChartGridProps {
  currentPrice: number;
  priceHistory: PricePoint[];
  asset: string;
  activeBets: TapBet[];
  onTap: (box: GridBox) => void;
}

// Price increments by asset (for $0.50-style rows)
const PRICE_INCREMENTS: Record<string, number> = {
  BTC: 5,      // $5 per row for BTC
  ETH: 0.5,    // $0.50 per row for ETH
  SOL: 0.02,   // $0.02 per row for SOL
  DEFAULT: 0.01,
};

// Time settings
const HISTORY_SECONDS = 60;      // 60 seconds of history on left
const FUTURE_SECONDS = 90;       // 90 seconds into future on right
const TIME_SLOT_SECONDS = 5;     // Each column is 5 seconds
const NUM_ROWS = 16;             // Price rows
const NOW_POSITION = 0.35;       // "Now" line at 35% from left

export const TapChartGrid = memo(function TapChartGrid({
  currentPrice,
  priceHistory,
  asset,
  activeBets,
  onTap,
}: TapChartGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [priceZoom, setPriceZoom] = useState(1);
  const [hoveredBox, setHoveredBox] = useState<{ row: number; col: number } | null>(null);

  // Price increment adjusted by zoom
  const baseIncrement = PRICE_INCREMENTS[asset] || PRICE_INCREMENTS.DEFAULT;
  const increment = baseIncrement / priceZoom;

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.003;
    setPriceZoom(prev => Math.max(0.3, Math.min(3, prev * (1 + delta))));
  }, []);

  // Touch zoom
  const touchRef = useRef<{ distance: number; zoom: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchRef.current = { distance, zoom: priceZoom };
    }
  }, [priceZoom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / touchRef.current.distance;
      setPriceZoom(Math.max(0.3, Math.min(3, touchRef.current.zoom * scale)));
    }
  }, []);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !currentPrice) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 70, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Price range centered on current price
    const halfRows = Math.floor(NUM_ROWS / 2);
    const topPrice = Math.ceil(currentPrice / increment) * increment + halfRows * increment;
    const bottomPrice = topPrice - NUM_ROWS * increment;
    const priceRange = topPrice - bottomPrice;

    const priceToY = (p: number) => {
      return padding.top + ((topPrice - p) / priceRange) * chartHeight;
    };

    // Time calculations
    const totalSeconds = HISTORY_SECONDS + FUTURE_SECONDS;
    const nowX = padding.left + chartWidth * NOW_POSITION;
    const pxPerSecond = chartWidth / totalSeconds;

    const timeToX = (secondsFromNow: number) => {
      return nowX + secondsFromNow * pxPerSecond;
    };

    // Calculate multiplier based on price distance and time
    const calculateMultiplier = (priceLevel: number, futureSeconds: number) => {
      const priceDist = Math.abs(priceLevel - currentPrice) / increment;
      const distFactor = 1 + Math.pow(priceDist * 0.15, 1.4);
      const timeFactor = 1 + (futureSeconds / 30) * 0.3;
      const raw = distFactor * timeFactor;
      return Math.max(1.1, Math.min(20, Math.round(raw * 100) / 100));
    };

    const draw = () => {
      const now = Date.now();
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      // Draw grid boxes (future only - right of "now" line)
      const numFutureCols = Math.floor(FUTURE_SECONDS / TIME_SLOT_SECONDS);
      const colWidth = (chartWidth * (1 - NOW_POSITION)) / numFutureCols;
      const rowHeight = chartHeight / NUM_ROWS;

      for (let row = 0; row < NUM_ROWS; row++) {
        const priceLevel = topPrice - row * increment;
        const y = padding.top + row * rowHeight;
        const isAbovePrice = priceLevel > currentPrice;
        const isCurrentRow = Math.abs(priceLevel - currentPrice) < increment * 0.5;

        for (let col = 0; col < numFutureCols; col++) {
          const futureSeconds = (col + 1) * TIME_SLOT_SECONDS;
          const x = nowX + col * colWidth;

          // Check if there's an active bet on this box
          const bet = activeBets.find(b => {
            const betTimeRemaining = (b.expiresAt - now) / 1000;
            const colStart = col * TIME_SLOT_SECONDS;
            const colEnd = (col + 1) * TIME_SLOT_SECONDS;
            return Math.abs(b.targetPrice - priceLevel) < increment * 0.5 &&
                   betTimeRemaining > colStart && betTimeRemaining <= colEnd;
          });

          const isActive = bet?.status === 'active';
          const isHovered = hoveredBox?.row === row && hoveredBox?.col === col;
          const multiplier = calculateMultiplier(priceLevel, futureSeconds);

          // Box opacity fades towards right (further in future)
          const fadeOpacity = 1 - (col / numFutureCols) * 0.3;

          // Box fill
          let fillColor: string;
          if (isActive) {
            fillColor = 'rgba(250, 204, 21, 0.5)';
          } else if (isCurrentRow) {
            fillColor = 'rgba(80, 227, 194, 0.15)';
          } else if (isHovered) {
            fillColor = isAbovePrice ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
          } else {
            const baseAlpha = 0.08 * fadeOpacity;
            fillColor = isAbovePrice
              ? `rgba(34, 197, 94, ${baseAlpha})`
              : `rgba(239, 68, 68, ${baseAlpha})`;
          }

          ctx.fillStyle = fillColor;
          ctx.fillRect(x + 1, y + 1, colWidth - 2, rowHeight - 2);

          // Box border
          const borderAlpha = isActive ? 0.8 : 0.2 * fadeOpacity;
          ctx.strokeStyle = isActive
            ? 'rgba(250, 204, 21, 0.8)'
            : isAbovePrice
              ? `rgba(34, 197, 94, ${borderAlpha})`
              : `rgba(239, 68, 68, ${borderAlpha})`;
          ctx.lineWidth = isActive ? 2 : 1;
          ctx.strokeRect(x + 1, y + 1, colWidth - 2, rowHeight - 2);

          // Multiplier text
          const textAlpha = 0.7 * fadeOpacity;
          ctx.fillStyle = isActive
            ? '#000'
            : isAbovePrice
              ? `rgba(34, 197, 94, ${textAlpha})`
              : `rgba(239, 68, 68, ${textAlpha})`;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${multiplier.toFixed(2)}X`, x + colWidth / 2, y + rowHeight / 2);

          // Time remaining for active bets
          if (isActive && bet) {
            const remaining = Math.max(0, Math.ceil((bet.expiresAt - now) / 1000));
            ctx.fillStyle = '#000';
            ctx.font = 'bold 8px monospace';
            ctx.fillText(`${remaining}s`, x + colWidth / 2, y + rowHeight / 2 + 10);
          }
        }
      }

      // Draw price line (history + current)
      if (priceHistory.length >= 2) {
        // Sort by time and filter to visible range
        const visibleHistory = priceHistory
          .filter(p => (now - p.time) < HISTORY_SECONDS * 1000)
          .sort((a, b) => a.time - b.time);

        if (visibleHistory.length >= 2) {
          // Gradient fill under line
          const gradient = ctx.createLinearGradient(0, priceToY(currentPrice) - 50, 0, priceToY(currentPrice) + 50);
          gradient.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
          gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.15)');
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');

          ctx.beginPath();
          visibleHistory.forEach((point, i) => {
            const age = (now - point.time) / 1000;
            const x = timeToX(-age);
            const y = priceToY(point.price);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          // Close to bottom for fill
          const lastX = timeToX(0);
          ctx.lineTo(lastX, priceToY(currentPrice));
          ctx.lineTo(lastX, chartHeight + padding.top);
          ctx.lineTo(timeToX(-HISTORY_SECONDS), chartHeight + padding.top);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          // Price line
          ctx.beginPath();
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 10;

          visibleHistory.forEach((point, i) => {
            const age = (now - point.time) / 1000;
            const x = timeToX(-age);
            const y = priceToY(point.price);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          // Extend to "now"
          ctx.lineTo(nowX, priceToY(currentPrice));
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Current price dot with glow
          const pulse = 1 + Math.sin(now / 150) * 0.2;
          const currentY = priceToY(currentPrice);

          // Glow
          ctx.beginPath();
          ctx.arc(nowX, currentY, 10 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
          ctx.fill();

          // Dot
          ctx.beginPath();
          ctx.arc(nowX, currentY, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ec4899';
          ctx.fill();

          // "Now" vertical line
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.moveTo(nowX, padding.top);
          ctx.lineTo(nowX, height - padding.bottom);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Y-axis (right side) - Price labels
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(width - padding.right, 0, padding.right, height);

      for (let row = 0; row <= NUM_ROWS; row++) {
        const priceLevel = topPrice - row * increment;
        const y = priceToY(priceLevel);
        const isCurrentRow = Math.abs(priceLevel - currentPrice) < increment * 0.5;

        ctx.fillStyle = isCurrentRow ? '#ec4899' : '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const priceStr = priceLevel >= 1000
          ? `$${priceLevel.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
          : `$${priceLevel.toFixed(2)}`;
        ctx.fillText(priceStr, width - padding.right + 5, y);
      }

      // Current price badge
      const currentY = priceToY(currentPrice);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(width - padding.right + 2, currentY - 10, padding.right - 6, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      const currentPriceStr = currentPrice >= 1000
        ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
        : `$${currentPrice.toFixed(2)}`;
      ctx.fillText(currentPriceStr, width - padding.right / 2, currentY);

      // X-axis (bottom) - Time labels
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, height - padding.bottom, width, padding.bottom);

      // Time markers
      const timeMarkers = [];
      for (let s = -HISTORY_SECONDS; s <= FUTURE_SECONDS; s += 15) {
        timeMarkers.push(s);
      }

      timeMarkers.forEach(s => {
        const x = timeToX(s);
        if (x < padding.left || x > width - padding.right) return;

        const markerTime = new Date(now + s * 1000);
        const timeStr = markerTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).toUpperCase();

        ctx.fillStyle = s === 0 ? '#ec4899' : '#555';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, height - 10);

        // Tick mark
        ctx.beginPath();
        ctx.strokeStyle = s === 0 ? '#ec4899' : '#333';
        ctx.moveTo(x, height - padding.bottom);
        ctx.lineTo(x, height - padding.bottom + 5);
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentPrice, priceHistory, activeBets, hoveredBox, increment, priceZoom, asset]);

  // Handle clicks
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container || !currentPrice) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { top: 10, right: 70, bottom: 30, left: 10 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    const nowX = padding.left + chartWidth * NOW_POSITION;

    // Only clicks to the right of "now" line are valid
    if (x < nowX || x > rect.width - padding.right || y < padding.top || y > rect.height - padding.bottom) {
      return;
    }

    const numFutureCols = Math.floor(FUTURE_SECONDS / TIME_SLOT_SECONDS);
    const colWidth = (chartWidth * (1 - NOW_POSITION)) / numFutureCols;
    const rowHeight = chartHeight / NUM_ROWS;

    const col = Math.floor((x - nowX) / colWidth);
    const row = Math.floor((y - padding.top) / rowHeight);

    if (col >= 0 && col < numFutureCols && row >= 0 && row < NUM_ROWS) {
      const halfRows = Math.floor(NUM_ROWS / 2);
      const topPrice = Math.ceil(currentPrice / increment) * increment + halfRows * increment;
      const priceLevel = topPrice - row * increment;
      const futureSeconds = (col + 1) * TIME_SLOT_SECONDS;
      const isLong = priceLevel > currentPrice;

      // Calculate multiplier
      const priceDist = Math.abs(priceLevel - currentPrice) / increment;
      const distFactor = 1 + Math.pow(priceDist * 0.15, 1.4);
      const timeFactor = 1 + (futureSeconds / 30) * 0.3;
      const multiplier = Math.max(1.1, Math.min(20, Math.round(distFactor * timeFactor * 100) / 100));

      const box: GridBox = {
        id: `${row}-${col}`,
        row,
        col,
        price: priceLevel,
        timeWindow: futureSeconds,
        multiplier,
        direction: isLong ? 'long' : 'short',
      };

      onTap(box);
    }
  }, [currentPrice, increment, onTap]);

  // Handle hover
  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { top: 10, right: 70, bottom: 30, left: 10 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    const nowX = padding.left + chartWidth * NOW_POSITION;

    if (x < nowX || x > rect.width - padding.right || y < padding.top || y > rect.height - padding.bottom) {
      setHoveredBox(null);
      return;
    }

    const numFutureCols = Math.floor(FUTURE_SECONDS / TIME_SLOT_SECONDS);
    const colWidth = (chartWidth * (1 - NOW_POSITION)) / numFutureCols;
    const rowHeight = chartHeight / NUM_ROWS;

    const col = Math.floor((x - nowX) / colWidth);
    const row = Math.floor((y - padding.top) / rowHeight);

    if (col >= 0 && col < numFutureCols && row >= 0 && row < NUM_ROWS) {
      setHoveredBox({ row, col });
    } else {
      setHoveredBox(null);
    }
  }, []);

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
        <div className="text-gray-500 animate-pulse">Connecting to price feed...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0f] overflow-hidden select-none">
      {/* Zoom indicator */}
      <div className="absolute top-2 right-20 z-10 flex items-center gap-2 bg-black/60 backdrop-blur rounded px-2 py-1 text-xs">
        <span className="text-gray-500">Zoom</span>
        <span className="font-mono text-[#ec4899]">{priceZoom.toFixed(1)}x</span>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        onMouseLeave={() => setHoveredBox(null)}
      />
    </div>
  );
});
