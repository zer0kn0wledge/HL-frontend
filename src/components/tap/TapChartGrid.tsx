'use client';

import { memo, useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { GridBox, TapBet, PricePoint } from '@/lib/tap/types';

interface TapChartGridProps {
  currentPrice: number;
  priceHistory: PricePoint[];
  asset: string;
  activeBets: TapBet[];
  onTap: (box: GridBox) => void;
}

// Much smaller increments so price actually moves through boxes
const PRICE_INCREMENTS: Record<string, number> = {
  BTC: 10,    // $10 per row for BTC (was $50)
  ETH: 1,     // $1 per row for ETH
  SOL: 0.05,  // $0.05 per row for SOL
  DEFAULT: 0.01,
};

// Time columns - seconds into the future
const TIME_COLUMNS = [5, 10, 15, 30, 60];
const NUM_ROWS = 15; // 7 above, current, 7 below
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

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
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);
  const [hitBoxes, setHitBoxes] = useState<Set<string>>(new Set());

  // Track center price for smooth scrolling
  const [centerPrice, setCenterPrice] = useState(currentPrice);

  // Smoothly follow current price
  useEffect(() => {
    if (currentPrice && Math.abs(currentPrice - centerPrice) > 0) {
      // Smooth interpolation towards current price
      const diff = currentPrice - centerPrice;
      setCenterPrice(prev => prev + diff * 0.15);
    }
  }, [currentPrice, centerPrice]);

  // Get price increment for asset, adjusted by zoom
  const baseIncrement = PRICE_INCREMENTS[asset] || PRICE_INCREMENTS.DEFAULT;
  const increment = baseIncrement / priceZoom;

  // Generate price levels centered on current price
  const priceLevels = useMemo(() => {
    if (!centerPrice) return [];
    const basePrice = Math.round(centerPrice / increment) * increment;
    const levels: number[] = [];
    const halfRows = Math.floor(NUM_ROWS / 2);

    for (let i = halfRows; i >= -halfRows; i--) {
      levels.push(basePrice + i * increment);
    }
    return levels;
  }, [centerPrice, increment]);

  // Calculate multiplier based on distance and time
  const calculateMultiplier = useCallback((rowIndex: number, timeSeconds: number) => {
    const rowsFromCenter = Math.abs(rowIndex - Math.floor(NUM_ROWS / 2));

    // Distance factor: further = higher multiplier
    const distanceFactor = 1 + Math.pow(rowsFromCenter * 0.3, 1.5);

    // Time factor: shorter time = higher multiplier (harder)
    const timeFactor = Math.sqrt(30 / timeSeconds);

    const raw = distanceFactor * timeFactor;
    return Math.max(1.1, Math.min(20, Math.round(raw * 10) / 10));
  }, []);

  // Generate grid boxes
  const gridBoxes = useMemo(() => {
    if (!currentPrice || priceLevels.length === 0) return [];

    const boxes: GridBox[] = [];

    priceLevels.forEach((price, rowIndex) => {
      const isLong = price > currentPrice;
      const priceDelta = Math.abs(price - currentPrice) / currentPrice;

      TIME_COLUMNS.forEach((timeWindow, colIndex) => {
        const multiplier = calculateMultiplier(rowIndex, timeWindow);

        boxes.push({
          id: `${rowIndex}-${colIndex}`,
          row: rowIndex,
          col: colIndex,
          price,
          timeWindow,
          multiplier,
          direction: isLong ? 'long' : 'short',
        });
      });
    });

    return boxes;
  }, [currentPrice, priceLevels, calculateMultiplier]);

  // Check for price hitting bet boxes
  useEffect(() => {
    if (!currentPrice) return;

    activeBets.forEach(bet => {
      if (bet.status !== 'active') return;

      const priceHit = bet.direction === 'long'
        ? currentPrice >= bet.targetPrice
        : currentPrice <= bet.targetPrice;

      if (priceHit && !hitBoxes.has(bet.id)) {
        setHitBoxes(prev => new Set(prev).add(bet.id));
        // Remove from hit boxes after animation
        setTimeout(() => {
          setHitBoxes(prev => {
            const next = new Set(prev);
            next.delete(bet.id);
            return next;
          });
        }, 1000);
      }
    });
  }, [currentPrice, activeBets, hitBoxes]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.003;
    setPriceZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * (1 + delta))));
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
      setPriceZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, touchRef.current.zoom * scale)));
    }
  }, []);

  // Setup event listeners
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

  // Main canvas rendering - unified chart with boxes
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
    const yAxisWidth = 60;
    const xAxisHeight = 30;
    const chartWidth = width - yAxisWidth;
    const chartHeight = height - xAxisHeight;

    // Price range
    const topPrice = priceLevels[0] || currentPrice + increment * (NUM_ROWS / 2);
    const bottomPrice = priceLevels[priceLevels.length - 1] || currentPrice - increment * (NUM_ROWS / 2);
    const priceRange = topPrice - bottomPrice;

    const priceToY = (p: number) => {
      return ((topPrice - p) / priceRange) * chartHeight;
    };

    const rowHeight = chartHeight / NUM_ROWS;
    const colWidth = chartWidth / TIME_COLUMNS.length;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // Draw grid boxes FIRST (underneath price line)
      gridBoxes.forEach(box => {
        const x = yAxisWidth + box.col * colWidth;
        const y = box.row * rowHeight;
        const isLong = box.direction === 'long';
        const isCurrentRow = Math.abs(box.price - currentPrice) < increment * 0.5;

        // Check if this box has an active bet
        const bet = activeBets.find(b =>
          Math.abs(b.targetPrice - box.price) < increment * 0.5 &&
          b.direction === box.direction
        );
        const isActive = bet?.status === 'active';
        const isHit = bet && hitBoxes.has(bet.id);
        const isHovered = hoveredBox === box.id;

        // Box fill
        if (isHit) {
          ctx.fillStyle = isLong ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        } else if (isActive) {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.6)';
        } else if (isCurrentRow) {
          ctx.fillStyle = 'rgba(80, 227, 194, 0.15)';
        } else if (isHovered) {
          ctx.fillStyle = isLong ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)';
        } else {
          ctx.fillStyle = isLong ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)';
        }

        ctx.fillRect(x + 1, y + 1, colWidth - 2, rowHeight - 2);

        // Box border
        ctx.strokeStyle = isActive
          ? 'rgba(250, 204, 21, 0.8)'
          : isLong
            ? 'rgba(34, 197, 94, 0.3)'
            : 'rgba(239, 68, 68, 0.3)';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.strokeRect(x + 1, y + 1, colWidth - 2, rowHeight - 2);

        // Multiplier text
        ctx.fillStyle = isActive || isHit
          ? '#000'
          : isLong ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${box.multiplier.toFixed(1)}x`, x + colWidth / 2, y + rowHeight / 2);

        // Time remaining for active bets
        if (isActive && bet) {
          const remaining = Math.max(0, Math.ceil((bet.expiresAt - Date.now()) / 1000));
          ctx.fillStyle = '#000';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`${remaining}s`, x + colWidth / 2, y + rowHeight / 2 + 12);
        }
      });

      // Draw price line ON TOP of boxes
      if (priceHistory.length >= 2) {
        const now = Date.now();
        const historyWindowMs = 30000; // 30 seconds of history
        const visibleHistory = priceHistory.filter(p => now - p.time < historyWindowMs);

        if (visibleHistory.length >= 2) {
          // Price line gradient fill
          const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
          gradient.addColorStop(0, 'rgba(80, 227, 194, 0.2)');
          gradient.addColorStop(0.5, 'rgba(80, 227, 194, 0.1)');
          gradient.addColorStop(1, 'rgba(80, 227, 194, 0)');

          ctx.beginPath();
          visibleHistory.forEach((point, i) => {
            const age = now - point.time;
            // Price history on LEFT side of chart, flowing into the grid
            const x = yAxisWidth - (age / historyWindowMs) * yAxisWidth * 2;
            const y = priceToY(point.price);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });

          // Extend line to current position (left edge of grid)
          const currentY = priceToY(currentPrice);
          ctx.lineTo(yAxisWidth, currentY);
          ctx.lineTo(yAxisWidth, chartHeight);
          ctx.lineTo(0, chartHeight);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          // Draw the price line itself
          ctx.beginPath();
          ctx.strokeStyle = '#50E3C2';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = '#50E3C2';
          ctx.shadowBlur = 15;

          visibleHistory.forEach((point, i) => {
            const age = now - point.time;
            const x = yAxisWidth - (age / historyWindowMs) * yAxisWidth * 2;
            const y = priceToY(point.price);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.lineTo(yAxisWidth, currentY);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Current price dot - pulsing
          const pulse = 1 + Math.sin(Date.now() / 150) * 0.3;

          // Outer glow
          ctx.beginPath();
          ctx.arc(yAxisWidth, currentY, 12 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(80, 227, 194, 0.3)';
          ctx.fill();

          // Inner dot
          ctx.beginPath();
          ctx.arc(yAxisWidth, currentY, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#50E3C2';
          ctx.shadowColor = '#50E3C2';
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Horizontal line at current price across entire grid
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(80, 227, 194, 0.5)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.moveTo(yAxisWidth, currentY);
          ctx.lineTo(width, currentY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Y-axis (price labels)
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, yAxisWidth, chartHeight);

      priceLevels.forEach((price, i) => {
        const y = i * rowHeight + rowHeight / 2;
        const isAbove = price > currentPrice;
        const isCurrent = Math.abs(price - currentPrice) < increment * 0.5;

        if (isCurrent) {
          ctx.fillStyle = 'rgba(80, 227, 194, 0.2)';
          ctx.fillRect(0, i * rowHeight, yAxisWidth, rowHeight);
        }

        ctx.fillStyle = isCurrent ? '#50E3C2' : isAbove ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const priceStr = price >= 1000 ? `$${(price/1000).toFixed(1)}k` : `$${price.toFixed(2)}`;
        ctx.fillText(priceStr, yAxisWidth - 5, y);
      });

      // X-axis (time labels)
      ctx.fillStyle = '#111';
      ctx.fillRect(yAxisWidth, chartHeight, chartWidth, xAxisHeight);

      TIME_COLUMNS.forEach((time, i) => {
        const x = yAxisWidth + i * colWidth + colWidth / 2;
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(time < 60 ? `${time}s` : `${time/60}m`, x, chartHeight + xAxisHeight / 2);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentPrice, priceHistory, priceLevels, increment, gridBoxes, activeBets, hitBoxes, hoveredBox]);

  // Handle box clicks
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const yAxisWidth = 60;
    const xAxisHeight = 30;
    const chartWidth = rect.width - yAxisWidth;
    const chartHeight = rect.height - xAxisHeight;

    // Check if click is in grid area
    if (x < yAxisWidth || y > chartHeight) return;

    const col = Math.floor((x - yAxisWidth) / (chartWidth / TIME_COLUMNS.length));
    const row = Math.floor(y / (chartHeight / NUM_ROWS));

    if (col >= 0 && col < TIME_COLUMNS.length && row >= 0 && row < NUM_ROWS) {
      const box = gridBoxes.find(b => b.row === row && b.col === col);
      if (box) {
        // Check if already bet on
        const existingBet = activeBets.find(b =>
          Math.abs(b.targetPrice - box.price) < increment * 0.5 &&
          b.direction === box.direction
        );
        if (!existingBet) {
          onTap(box);
        }
      }
    }
  }, [gridBoxes, activeBets, increment, onTap]);

  // Handle hover
  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const yAxisWidth = 60;
    const xAxisHeight = 30;
    const chartWidth = rect.width - yAxisWidth;
    const chartHeight = rect.height - xAxisHeight;

    if (x < yAxisWidth || y > chartHeight) {
      setHoveredBox(null);
      return;
    }

    const col = Math.floor((x - yAxisWidth) / (chartWidth / TIME_COLUMNS.length));
    const row = Math.floor(y / (chartHeight / NUM_ROWS));

    if (col >= 0 && col < TIME_COLUMNS.length && row >= 0 && row < NUM_ROWS) {
      setHoveredBox(`${row}-${col}`);
    } else {
      setHoveredBox(null);
    }
  }, []);

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-gray-500 animate-pulse">Connecting to price feed...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Zoom indicator */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-black/80 backdrop-blur rounded px-2 py-1 border border-white/10">
        <span className="text-[10px] text-gray-500">Zoom</span>
        <span className="text-xs font-mono text-[#50E3C2]">{priceZoom.toFixed(1)}x</span>
      </div>

      {/* Current price display */}
      <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur rounded px-2 py-1 border border-[#50E3C2]/30">
        <span className="text-sm font-mono text-[#50E3C2]">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
