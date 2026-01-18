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

// Euphoria-style config
const PRICE_INCREMENTS: Record<string, number> = {
  BTC: 2.5,     // $2.50 per row for fine movement
  ETH: 0.25,
  SOL: 0.01,
  DEFAULT: 0.005,
};

// Grid config - fewer, larger boxes like Euphoria
const NUM_ROWS = 12;
const NUM_COLS = 12;
const COL_SECONDS = 5; // 5 seconds per column

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

  // Smooth price tracking
  const smoothPriceRef = useRef(currentPrice);
  const targetPriceRef = useRef(currentPrice);

  const [priceZoom, setPriceZoom] = useState(1);
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);

  // Update target price when current price changes
  useEffect(() => {
    if (currentPrice > 0) {
      targetPriceRef.current = currentPrice;
    }
  }, [currentPrice]);

  const baseIncrement = PRICE_INCREMENTS[asset] || PRICE_INCREMENTS.DEFAULT;
  const increment = baseIncrement / priceZoom;

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.002;
    setPriceZoom(prev => Math.max(0.5, Math.min(4, prev * (1 + delta))));
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
      setPriceZoom(Math.max(0.5, Math.min(4, touchRef.current.zoom * scale)));
    }
  }, []);

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

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

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
    const priceAxisWidth = 65;
    const timeAxisHeight = 25;
    const chartW = width - priceAxisWidth;
    const chartH = height - timeAxisHeight;

    const colW = chartW / NUM_COLS;
    const rowH = chartH / NUM_ROWS;

    // Calculate multiplier
    const getMultiplier = (rowDist: number, colIdx: number) => {
      const priceFactor = 1 + Math.pow(rowDist * 0.12, 1.3);
      const timeFactor = 1 + (colIdx * 0.08);
      return Math.max(1.05, Math.min(15, priceFactor * timeFactor));
    };

    const draw = () => {
      const now = Date.now();

      // Smooth price interpolation (lerp)
      smoothPriceRef.current += (targetPriceRef.current - smoothPriceRef.current) * 0.08;
      const displayPrice = smoothPriceRef.current;

      if (!displayPrice || displayPrice <= 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Price range centered on smooth price
      const centerPrice = Math.round(displayPrice / increment) * increment;
      const halfRows = NUM_ROWS / 2;
      const topPrice = centerPrice + halfRows * increment;
      const bottomPrice = centerPrice - halfRows * increment;
      const priceRange = topPrice - bottomPrice;

      const priceToY = (p: number) => ((topPrice - p) / priceRange) * chartH;
      const yToPrice = (y: number) => topPrice - (y / chartH) * priceRange;

      // Time reference - "now" is at 40% from left
      const nowX = chartW * 0.4;
      const pxPerSecond = chartW / (NUM_COLS * COL_SECONDS);
      const timeToX = (secFromNow: number) => nowX + secFromNow * pxPerSecond;

      ctx.clearRect(0, 0, width, height);

      // Dark background
      ctx.fillStyle = '#08080c';
      ctx.fillRect(0, 0, width, height);

      // Draw grid boxes
      for (let row = 0; row < NUM_ROWS; row++) {
        const rowPrice = topPrice - (row + 0.5) * increment;
        const y = row * rowH;
        const isAbove = rowPrice > displayPrice;
        const rowDist = Math.abs(row - (NUM_ROWS / 2 - 0.5));

        for (let col = 0; col < NUM_COLS; col++) {
          const x = col * colW;
          const colCenterSec = (col - NUM_COLS * 0.4 + 0.5) * COL_SECONDS;
          const isFuture = colCenterSec > 0;
          const isPast = colCenterSec < -COL_SECONDS;

          // Only show boxes that are in the future or very recent past
          const opacity = isPast
            ? Math.max(0, 1 + colCenterSec / (COL_SECONDS * 3)) * 0.3
            : isFuture
              ? Math.max(0.3, 1 - col / NUM_COLS * 0.5)
              : 0.8;

          if (opacity <= 0.05) continue;

          const multiplier = getMultiplier(rowDist, Math.max(0, col - Math.floor(NUM_COLS * 0.4)));

          // Check for active bet
          const bet = activeBets.find(b => {
            const timeLeft = (b.expiresAt - now) / 1000;
            const colStart = (col - NUM_COLS * 0.4) * COL_SECONDS;
            const colEnd = colStart + COL_SECONDS;
            return Math.abs(b.targetPrice - rowPrice) < increment * 0.6 &&
                   timeLeft > colStart && timeLeft <= colEnd;
          });

          const isActive = bet?.status === 'active';
          const isHovered = hoveredCell?.row === row && hoveredCell?.col === col && isFuture;
          const isCurrentRow = Math.abs(rowPrice - displayPrice) < increment * 0.6;

          // Box colors
          let bgColor: string;
          let borderColor: string;
          let textColor: string;

          if (isActive) {
            bgColor = `rgba(250, 204, 21, ${0.4 * opacity})`;
            borderColor = `rgba(250, 204, 21, ${0.8 * opacity})`;
            textColor = '#000';
          } else if (isCurrentRow) {
            bgColor = `rgba(236, 72, 153, ${0.12 * opacity})`;
            borderColor = `rgba(236, 72, 153, ${0.25 * opacity})`;
            textColor = `rgba(236, 72, 153, ${opacity})`;
          } else if (isHovered) {
            bgColor = isAbove
              ? `rgba(34, 197, 94, ${0.25 * opacity})`
              : `rgba(239, 68, 68, ${0.25 * opacity})`;
            borderColor = isAbove
              ? `rgba(34, 197, 94, ${0.5 * opacity})`
              : `rgba(239, 68, 68, ${0.5 * opacity})`;
            textColor = isAbove
              ? `rgba(34, 197, 94, ${opacity})`
              : `rgba(239, 68, 68, ${opacity})`;
          } else {
            bgColor = isAbove
              ? `rgba(34, 197, 94, ${0.06 * opacity})`
              : `rgba(239, 68, 68, ${0.06 * opacity})`;
            borderColor = isAbove
              ? `rgba(34, 197, 94, ${0.15 * opacity})`
              : `rgba(239, 68, 68, ${0.15 * opacity})`;
            textColor = isAbove
              ? `rgba(34, 197, 94, ${0.6 * opacity})`
              : `rgba(239, 68, 68, ${0.6 * opacity})`;
          }

          // Draw box
          ctx.fillStyle = bgColor;
          ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = isActive ? 2 : 1;
          ctx.strokeRect(x + 1, y + 1, colW - 2, rowH - 2);

          // Multiplier text (only for future boxes with enough opacity)
          if (opacity > 0.2 && isFuture) {
            ctx.fillStyle = textColor;
            ctx.font = `bold ${Math.min(11, rowH / 3)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${multiplier.toFixed(2)}X`, x + colW / 2, y + rowH / 2);

            // Show countdown for active bets
            if (isActive && bet) {
              const secs = Math.ceil((bet.expiresAt - now) / 1000);
              ctx.fillStyle = '#000';
              ctx.font = `bold 9px monospace`;
              ctx.fillText(`${secs}s`, x + colW / 2, y + rowH / 2 + 12);
            }
          }
        }
      }

      // Draw price line OVER boxes
      const visibleHistory = priceHistory
        .filter(p => (now - p.time) < 120000)
        .sort((a, b) => a.time - b.time);

      if (visibleHistory.length >= 2) {
        // Gradient under line
        const gradient = ctx.createLinearGradient(0, priceToY(displayPrice) - 30, 0, priceToY(displayPrice) + 60);
        gradient.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
        gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.1)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');

        ctx.beginPath();
        let firstX = 0, firstY = 0;
        visibleHistory.forEach((p, i) => {
          const age = (now - p.time) / 1000;
          const x = timeToX(-age);
          const y = priceToY(p.price);
          if (i === 0) {
            ctx.moveTo(x, y);
            firstX = x;
            firstY = y;
          } else {
            ctx.lineTo(x, y);
          }
        });
        // Extend to now position
        ctx.lineTo(nowX, priceToY(displayPrice));
        ctx.lineTo(nowX, chartH);
        ctx.lineTo(firstX, chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main price line
        ctx.beginPath();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 8;

        visibleHistory.forEach((p, i) => {
          const age = (now - p.time) / 1000;
          const x = timeToX(-age);
          const y = priceToY(p.price);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.lineTo(nowX, priceToY(displayPrice));
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Pulsing dot at current price
        const pulse = 1 + Math.sin(now / 120) * 0.25;
        const dotY = priceToY(displayPrice);

        ctx.beginPath();
        ctx.arc(nowX, dotY, 8 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nowX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Horizontal price line across grid
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.moveTo(0, dotY);
        ctx.lineTo(chartW, dotY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Right Y-axis (prices)
      ctx.fillStyle = '#08080c';
      ctx.fillRect(chartW, 0, priceAxisWidth, height);

      for (let row = 0; row <= NUM_ROWS; row++) {
        const price = topPrice - row * increment;
        const y = row * rowH;
        const isCurrent = Math.abs(price - displayPrice) < increment * 0.6;

        ctx.fillStyle = isCurrent ? '#ec4899' : '#555';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const priceStr = price >= 1000
          ? `$${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}`
          : `$${price.toFixed(2)}`;
        ctx.fillText(priceStr, chartW + 4, y);
      }

      // Current price badge
      const badgeY = priceToY(displayPrice);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(chartW + 2, badgeY - 9, priceAxisWidth - 6, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      const priceStr = displayPrice >= 1000
        ? `$${displayPrice.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}`
        : `$${displayPrice.toFixed(2)}`;
      ctx.fillText(priceStr, chartW + priceAxisWidth / 2, badgeY);

      // Bottom X-axis (time)
      ctx.fillStyle = '#08080c';
      ctx.fillRect(0, chartH, chartW, timeAxisHeight);

      for (let col = 0; col <= NUM_COLS; col += 2) {
        const secFromNow = (col - NUM_COLS * 0.4) * COL_SECONDS;
        const x = col * colW;
        const t = new Date(now + secFromNow * 1000);
        const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        ctx.fillStyle = Math.abs(secFromNow) < COL_SECONDS / 2 ? '#ec4899' : '#444';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, chartH + 14);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [priceHistory, activeBets, hoveredCell, increment, priceZoom, asset]);

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container || !currentPrice) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const priceAxisWidth = 65;
    const timeAxisHeight = 25;
    const chartW = rect.width - priceAxisWidth;
    const chartH = rect.height - timeAxisHeight;
    const colW = chartW / NUM_COLS;
    const rowH = chartH / NUM_ROWS;

    if (x >= chartW || y >= chartH) return;

    const col = Math.floor(x / colW);
    const row = Math.floor(y / rowH);

    // Only future columns are tappable (col > 40% of columns)
    const futureStartCol = Math.floor(NUM_COLS * 0.4);
    if (col < futureStartCol) return;

    const centerPrice = Math.round(currentPrice / increment) * increment;
    const halfRows = NUM_ROWS / 2;
    const topPrice = centerPrice + halfRows * increment;
    const rowPrice = topPrice - (row + 0.5) * increment;

    const colIdx = col - futureStartCol;
    const timeWindow = (colIdx + 1) * COL_SECONDS;
    const rowDist = Math.abs(row - (NUM_ROWS / 2 - 0.5));
    const priceFactor = 1 + Math.pow(rowDist * 0.12, 1.3);
    const timeFactor = 1 + (colIdx * 0.08);
    const multiplier = Math.max(1.05, Math.min(15, priceFactor * timeFactor));

    const box: GridBox = {
      id: `${row}-${col}`,
      row,
      col,
      price: rowPrice,
      timeWindow,
      multiplier,
      direction: rowPrice > currentPrice ? 'long' : 'short',
    };

    onTap(box);
  }, [currentPrice, increment, onTap]);

  // Hover handler
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const priceAxisWidth = 65;
    const timeAxisHeight = 25;
    const chartW = rect.width - priceAxisWidth;
    const chartH = rect.height - timeAxisHeight;
    const colW = chartW / NUM_COLS;
    const rowH = chartH / NUM_ROWS;

    if (x >= chartW || y >= chartH) {
      setHoveredCell(null);
      return;
    }

    const col = Math.floor(x / colW);
    const row = Math.floor(y / rowH);
    const futureStartCol = Math.floor(NUM_COLS * 0.4);

    if (col >= futureStartCol && col < NUM_COLS && row >= 0 && row < NUM_ROWS) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  }, []);

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-[#08080c]">
        <div className="text-gray-500 animate-pulse">Connecting...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#08080c] overflow-hidden select-none">
      <div className="absolute top-2 right-16 z-10 text-xs bg-black/60 px-2 py-1 rounded flex items-center gap-2">
        <span className="text-gray-500">Zoom</span>
        <span className="text-[#ec4899] font-mono">{priceZoom.toFixed(1)}x</span>
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoveredCell(null)}
      />
    </div>
  );
});
