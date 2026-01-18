'use client';

import { memo, useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { GridBox, TapBet, PricePoint } from '@/lib/tap/types';
import { getPriceIncrement, calculateMultiplier } from '@/lib/tap/multiplierCalculator';

interface TapChartGridProps {
  currentPrice: number;
  priceHistory: PricePoint[];
  asset: string;
  activeBets: TapBet[];
  onTap: (box: GridBox) => void;
}

// Time columns in seconds - more granular
const TIME_COLUMNS = [5, 10, 15, 30, 45, 60, 90, 120];
const NUM_ROWS = 12; // Balanced rows for clear visibility
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const CHART_WIDTH_PERCENT = 0.25; // Price chart takes 25% of width

export const TapChartGrid = memo(function TapChartGrid({
  currentPrice,
  priceHistory,
  asset,
  activeBets,
  onTap,
}: TapChartGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Zoom state - continuous, not presets
  const [priceZoom, setPriceZoom] = useState(1.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartZoom, setDragStartZoom] = useState(3);
  const [poppedBoxes, setPoppedBoxes] = useState<Map<string, 'win' | 'lose'>>(new Map());

  // Base price increment adjusted by zoom
  const baseIncrement = getPriceIncrement(asset);
  const increment = baseIncrement / priceZoom;

  // Handle wheel zoom (trackpad pinch translates to wheel events)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // Pinch zoom on trackpad sends ctrlKey + wheel
    const delta = e.ctrlKey ? -e.deltaY * 0.02 : -e.deltaY * 0.005;

    setPriceZoom(prev => {
      const newZoom = prev * (1 + delta);
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    });
  }, []);

  // Handle touch events for pinch zoom
  const touchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { distance, zoom: priceZoom };
    }
  }, [priceZoom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / touchStartRef.current.distance;
      const newZoom = touchStartRef.current.zoom * scale;
      setPriceZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // Handle Y-axis drag to zoom
  const handleYAxisMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartZoom(priceZoom);
  }, [priceZoom]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaY = dragStartY - e.clientY;
      const zoomDelta = deltaY * 0.01;
      const newZoom = dragStartZoom * (1 + zoomDelta);
      setPriceZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
    }
  }, [isDragging, dragStartY, dragStartZoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseMove, handleMouseUp]);

  // Generate price levels centered around current price
  const priceLevels = useMemo(() => {
    if (!currentPrice) return [];
    const basePrice = Math.round(currentPrice / increment) * increment;
    const levels: number[] = [];
    const halfRows = Math.floor(NUM_ROWS / 2);

    for (let i = halfRows; i >= -halfRows + 1; i--) {
      levels.push(basePrice + i * increment);
    }

    return levels;
  }, [currentPrice, increment]);

  // Generate grid boxes
  const gridBoxes = useMemo(() => {
    if (!currentPrice || priceLevels.length === 0) return [];

    const boxes: GridBox[] = [];

    priceLevels.forEach((price, rowIndex) => {
      const isLong = price > currentPrice;
      const priceDelta = Math.abs(price - currentPrice) / currentPrice;

      TIME_COLUMNS.forEach((timeWindow, colIndex) => {
        const multiplier = calculateMultiplier(priceDelta, timeWindow);

        boxes.push({
          id: `${isLong ? 'long' : 'short'}-${rowIndex}-${colIndex}`,
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
  }, [currentPrice, priceLevels]);

  // Check for wins/losses
  useEffect(() => {
    activeBets.forEach(bet => {
      if (bet.status === 'active') {
        const priceHit = bet.direction === 'long'
          ? currentPrice >= bet.targetPrice
          : currentPrice <= bet.targetPrice;

        if (priceHit && !poppedBoxes.has(bet.id)) {
          setPoppedBoxes(prev => new Map(prev).set(bet.id, 'win'));
          setTimeout(() => {
            setPoppedBoxes(prev => {
              const next = new Map(prev);
              next.delete(bet.id);
              return next;
            });
          }, 1500);
        }

        if (Date.now() >= bet.expiresAt && !poppedBoxes.has(bet.id)) {
          setPoppedBoxes(prev => new Map(prev).set(bet.id, 'lose'));
          setTimeout(() => {
            setPoppedBoxes(prev => {
              const next = new Map(prev);
              next.delete(bet.id);
              return next;
            });
          }, 1500);
        }
      }
    });
  }, [activeBets, currentPrice, poppedBoxes]);

  // Animated price line
  useEffect(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid || !currentPrice) return;

    const rect = grid.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (priceHistory.length < 2) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const topPrice = priceLevels[0] || currentPrice + increment * (NUM_ROWS / 2);
      const bottomPrice = priceLevels[priceLevels.length - 1] || currentPrice - increment * (NUM_ROWS / 2);
      const priceRange = topPrice - bottomPrice;

      const priceToY = (p: number) => {
        const clamped = Math.max(bottomPrice, Math.min(topPrice, p));
        return ((topPrice - clamped) / priceRange) * canvas.height;
      };

      const now = Date.now();
      const historyWindowMs = 60000;
      const visibleHistory = priceHistory.filter(p => now - p.time < historyWindowMs);

      if (visibleHistory.length >= 2) {
        // Price line fills entire chart area - current price at right edge
        const lineEndX = canvas.width - 10; // Leave 10px margin at right

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(80, 227, 194, 0.15)');
        gradient.addColorStop(0.5, 'rgba(80, 227, 194, 0.08)');
        gradient.addColorStop(1, 'rgba(80, 227, 194, 0)');

        ctx.beginPath();
        visibleHistory.forEach((point, i) => {
          const age = now - point.time;
          const x = lineEndX - (age / historyWindowMs) * lineEndX;
          const y = priceToY(point.price);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.lineTo(lineEndX, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw price line
        ctx.beginPath();
        ctx.strokeStyle = '#50E3C2';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#50E3C2';
        ctx.shadowBlur = 12;

        visibleHistory.forEach((point, i) => {
          const age = now - point.time;
          const x = lineEndX - (age / historyWindowMs) * lineEndX;
          const y = priceToY(point.price);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Current price indicator - pulsing dot at line end
        const lastPoint = visibleHistory[visibleHistory.length - 1];
        const y = priceToY(lastPoint.price);
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.3;

        // Outer glow
        ctx.beginPath();
        ctx.arc(lineEndX, y, 8 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80, 227, 194, 0.3)';
        ctx.shadowBlur = 20;
        ctx.fill();

        // Inner dot
        ctx.beginPath();
        ctx.arc(lineEndX, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#50E3C2';
        ctx.shadowBlur = 0;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [priceHistory, currentPrice, priceLevels, increment]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) return `$${(price / 1000).toFixed(1)}k`;
    if (price >= 1000) return `$${price.toFixed(0)}`;
    return `$${price.toFixed(2)}`;
  };

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-gray-500">Connecting...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex flex-col overflow-hidden select-none">
      {/* Zoom indicator */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-2 bg-black/80 backdrop-blur rounded-lg border border-white/10 px-2 py-1">
        <span className="text-[10px] text-gray-500">Zoom</span>
        <span className="text-xs font-mono text-[#50E3C2]">{priceZoom.toFixed(1)}x</span>
      </div>

      {/* Instructions */}
      <div className="absolute top-2 left-16 z-30 text-[9px] text-gray-600">
        Pinch/scroll to zoom • Drag Y-axis
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Y-Axis - draggable for zoom */}
        <div
          className={`w-12 flex flex-col shrink-0 cursor-ns-resize border-r border-white/10 ${isDragging ? 'bg-[#50E3C2]/10' : ''}`}
          onMouseDown={handleYAxisMouseDown}
        >
          {priceLevels.map((price, i) => {
            const isAbove = price > currentPrice;
            const isCurrent = Math.abs(price - currentPrice) < increment * 0.5;
            return (
              <div
                key={`price-${i}`}
                className={`flex-1 flex items-center justify-end pr-1 text-[9px] font-mono ${
                  isCurrent ? 'bg-[#50E3C2]/20 text-[#50E3C2]' : ''
                }`}
                style={{ color: isCurrent ? '#50E3C2' : isAbove ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)' }}
              >
                {formatPrice(price)}
              </div>
            );
          })}
          <div className="h-6 shrink-0" />
        </div>

        {/* Chart area - shows price history */}
        <div
          ref={gridRef}
          className="relative shrink-0 border-r border-white/10"
          style={{ width: '20%' }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
          />
          {/* Current price label */}
          <div className="absolute right-0 text-[8px] font-mono text-[#50E3C2] bg-[#50E3C2]/20 px-1 rounded-l"
            style={{
              top: `${((priceLevels[0] - currentPrice) / (priceLevels[0] - priceLevels[priceLevels.length - 1])) * 100}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {formatPrice(currentPrice)}
          </div>
          <div className="h-6 absolute bottom-0 left-0 right-0 flex items-center justify-center text-[9px] text-gray-500 border-t border-white/10">
            Price
          </div>
        </div>

        {/* Grid area - tap boxes */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            className="flex-1 relative"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${NUM_ROWS}, 1fr)`,
              gridTemplateColumns: `repeat(${TIME_COLUMNS.length}, 1fr)`,
              gap: '1px',
            }}
          >
            {/* Grid boxes */}
            {gridBoxes.map((box) => {
              const bet = activeBets.find(b =>
                Math.abs(b.targetPrice - box.price) < increment * 0.5 &&
                b.direction === box.direction
              );
              const isActive = bet?.status === 'active';
              const isLong = box.direction === 'long';
              const popState = bet ? poppedBoxes.get(bet.id) : undefined;
              const rowsFromCenter = Math.abs(box.row - NUM_ROWS / 2);
              const isFarFromPrice = rowsFromCenter > NUM_ROWS / 3;

              let timeRemaining = 0;
              if (isActive && bet) {
                timeRemaining = Math.max(0, Math.ceil((bet.expiresAt - Date.now()) / 1000));
              }

              return (
                <motion.button
                  key={box.id}
                  className={`
                    relative flex flex-col items-center justify-center text-[9px]
                    border transition-all duration-100
                    ${!bet && isLong && 'border-green-500/30 bg-green-500/10 hover:bg-green-500/30 hover:border-green-500/50'}
                    ${!bet && !isLong && 'border-red-500/30 bg-red-500/10 hover:bg-red-500/30 hover:border-red-500/50'}
                    ${isActive && !popState && 'bg-yellow-400 border-yellow-400 animate-pulse'}
                    ${popState === 'win' && 'bg-green-500 border-green-500 scale-110'}
                    ${popState === 'lose' && 'bg-red-500 border-red-500 scale-90'}
                  `}
                  style={{
                    gridRow: box.row + 1,
                    gridColumn: box.col + 1,
                    opacity: isFarFromPrice && !isActive ? 0.5 : 1,
                  }}
                  whileTap={!bet ? { scale: 0.9, backgroundColor: isLong ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)' } : undefined}
                  onClick={() => !bet && onTap(box)}
                  disabled={!!bet}
                >
                  <span className={`font-bold ${
                    isActive || popState ? 'text-black' :
                    isLong ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {box.multiplier.toFixed(1)}x
                  </span>
                  {isActive && bet && !popState && (
                    <span className="text-[8px] text-black font-bold">{timeRemaining}s</span>
                  )}
                  {popState === 'win' && <span className="text-sm">💰</span>}
                  {popState === 'lose' && <span className="text-sm">💥</span>}
                </motion.button>
              );
            })}
          </div>

          {/* Time labels */}
          <div className="h-6 flex shrink-0 border-t border-white/10">
            {TIME_COLUMNS.map((tw) => (
              <div
                key={tw}
                className="flex-1 flex items-center justify-center text-[9px] text-gray-500 font-mono"
              >
                {formatTime(tw)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
