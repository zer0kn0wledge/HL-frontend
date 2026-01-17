'use client';

import { memo, useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridBox, TapBet, PricePoint } from '@/lib/tap/types';
import { TIME_LABELS } from '@/lib/tap/constants';
import { getPriceIncrement, calculateMultiplier } from '@/lib/tap/multiplierCalculator';
import { ZoomIn, ZoomOut, Clock } from 'lucide-react';

interface TapChartGridProps {
  currentPrice: number;
  priceHistory: PricePoint[];
  asset: string;
  activeBets: TapBet[];
  onTap: (box: GridBox) => void;
}

const TIME_PRESETS = [
  { label: '15s', windows: [5, 10, 15, 20, 30, 45] },
  { label: '1m', windows: [15, 30, 45, 60, 90, 120] },
  { label: '5m', windows: [60, 120, 180, 240, 300, 600] },
];

export const TapChartGrid = memo(function TapChartGrid({
  currentPrice,
  priceHistory,
  asset,
  activeBets,
  onTap,
}: TapChartGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [priceZoom, setPriceZoom] = useState(1); // 0.5 = zoomed out, 2 = zoomed in
  const [timePreset, setTimePreset] = useState(0);
  const [recentWins, setRecentWins] = useState<Set<string>>(new Set());
  const [recentLosses, setRecentLosses] = useState<Set<string>>(new Set());

  const increment = getPriceIncrement(asset) / priceZoom;
  const timeWindows = TIME_PRESETS[timePreset].windows;

  const ROWS_ABOVE = 6;
  const ROWS_BELOW = 6;

  // Generate price levels centered around current price
  const priceLevels = useMemo(() => {
    if (!currentPrice) return [];
    const basePrice = Math.round(currentPrice / increment) * increment;
    const levels: number[] = [];

    for (let i = ROWS_ABOVE; i >= 1; i--) {
      levels.push(basePrice + i * increment);
    }
    for (let i = 1; i <= ROWS_BELOW; i++) {
      levels.push(basePrice - i * increment);
    }

    return levels;
  }, [currentPrice, increment]);

  // Generate grid boxes
  const gridBoxes = useMemo(() => {
    if (!currentPrice || priceLevels.length === 0) return [];

    const boxes: GridBox[][] = [];

    priceLevels.forEach((price, rowIndex) => {
      const isLong = price > currentPrice;
      const priceDelta = Math.abs(price - currentPrice) / currentPrice;
      const row: GridBox[] = [];

      timeWindows.forEach((timeWindow, colIndex) => {
        const multiplier = calculateMultiplier(priceDelta, timeWindow);

        row.push({
          id: `${isLong ? 'long' : 'short'}-${rowIndex}-${colIndex}`,
          row: rowIndex,
          col: colIndex,
          price,
          timeWindow,
          multiplier,
          direction: isLong ? 'long' : 'short',
        });
      });

      boxes.push(row);
    });

    return boxes;
  }, [currentPrice, priceLevels, timeWindows]);

  // Get bet for a specific box
  const getBetForBox = useCallback((price: number, direction: 'long' | 'short') => {
    return activeBets.find(
      b => Math.abs(b.targetPrice - price) < increment * 0.5 && b.direction === direction
    );
  }, [activeBets, increment]);

  // Check for wins/losses and trigger visual feedback
  useEffect(() => {
    activeBets.forEach(bet => {
      if (bet.status === 'active') {
        const priceHit = bet.direction === 'long'
          ? currentPrice >= bet.targetPrice
          : currentPrice <= bet.targetPrice;

        if (priceHit) {
          setRecentWins(prev => new Set(prev).add(bet.id));
          setTimeout(() => {
            setRecentWins(prev => {
              const next = new Set(prev);
              next.delete(bet.id);
              return next;
            });
          }, 1500);
        }

        if (Date.now() >= bet.expiresAt) {
          setRecentLosses(prev => new Set(prev).add(bet.id));
          setTimeout(() => {
            setRecentLosses(prev => {
              const next = new Set(prev);
              next.delete(bet.id);
              return next;
            });
          }, 1500);
        }
      }
    });
  }, [activeBets, currentPrice]);

  // Animated price line drawing
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

      if (priceHistory.length < 2) return;

      const basePrice = Math.round(currentPrice / increment) * increment;
      const topPrice = basePrice + ROWS_ABOVE * increment;
      const bottomPrice = basePrice - ROWS_BELOW * increment;
      const priceRange = topPrice - bottomPrice;

      const priceToY = (p: number) => {
        const clamped = Math.max(bottomPrice, Math.min(topPrice, p));
        return ((topPrice - clamped) / priceRange) * canvas.height;
      };

      // Get last 60 seconds of data for smooth scrolling
      const now = Date.now();
      const windowMs = 60000;
      const visibleHistory = priceHistory.filter(p => now - p.time < windowMs);

      if (visibleHistory.length < 2) return;

      // Draw gradient fill under price line
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(80, 227, 194, 0.15)');
      gradient.addColorStop(0.5, 'rgba(80, 227, 194, 0.05)');
      gradient.addColorStop(1, 'rgba(80, 227, 194, 0)');

      ctx.beginPath();
      visibleHistory.forEach((point, i) => {
        const x = ((point.time - (now - windowMs)) / windowMs) * canvas.width;
        const y = priceToY(point.price);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      // Complete fill path
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw price line with glow
      ctx.beginPath();
      ctx.strokeStyle = '#50E3C2';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#50E3C2';
      ctx.shadowBlur = 12;

      visibleHistory.forEach((point, i) => {
        const x = ((point.time - (now - windowMs)) / windowMs) * canvas.width;
        const y = priceToY(point.price);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw current price dot
      if (visibleHistory.length > 0) {
        const lastPoint = visibleHistory[visibleHistory.length - 1];
        const x = ((lastPoint.time - (now - windowMs)) / windowMs) * canvas.width;
        const y = priceToY(lastPoint.price);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#50E3C2';
        ctx.shadowBlur = 20;
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
  }, [priceHistory, currentPrice, increment]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-gray-500 text-lg">Connecting to price feed...</div>
      </div>
    );
  }

  const totalRows = ROWS_ABOVE + ROWS_BELOW;

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Controls bar */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
        {/* Time preset selector */}
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur rounded-lg border border-white/10 p-1">
          <Clock className="w-3 h-3 text-gray-400 ml-1" />
          {TIME_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => setTimePreset(i)}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                timePreset === i
                  ? 'bg-[#50E3C2] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Price zoom controls */}
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur rounded-lg border border-white/10 p-1">
          <button
            onClick={() => setPriceZoom(z => Math.min(3, z * 1.5))}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Zoom in (tighter price range)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 px-1">{priceZoom.toFixed(1)}x</span>
          <button
            onClick={() => setPriceZoom(z => Math.max(0.5, z / 1.5))}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Zoom out (wider price range)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Price labels (Y-axis) */}
        <div className="w-16 flex flex-col shrink-0">
          {priceLevels.map((price) => {
            const isLong = price > currentPrice;
            return (
              <div
                key={`price-${price}`}
                className="flex-1 flex items-center justify-end pr-2 text-[10px] font-mono border-b border-white/5"
                style={{ color: isLong ? '#22C55E' : '#EF4444' }}
              >
                ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            );
          })}
          <div className="h-7 shrink-0" />
        </div>

        {/* Main grid area */}
        <div className="flex-1 flex flex-col relative">
          <div
            ref={gridRef}
            className="flex-1 relative"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${totalRows}, 1fr)`,
              gridTemplateColumns: `repeat(${timeWindows.length}, 1fr)`,
              gap: '1px',
            }}
          >
            {/* Canvas for price line */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none z-10"
            />

            {/* Current price indicator */}
            <div
              className="absolute left-0 right-0 h-[2px] bg-[#50E3C2] z-20"
              style={{
                top: `${(ROWS_ABOVE / totalRows) * 100}%`,
                boxShadow: '0 0 15px #50E3C2, 0 0 30px rgba(80,227,194,0.5)',
              }}
            >
              <div className="absolute right-0 -top-3 px-2 py-0.5 bg-[#50E3C2] text-black text-[10px] font-bold rounded-l shadow-lg">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Grid boxes */}
            {gridBoxes.flat().map((box) => {
              const bet = getBetForBox(box.price, box.direction);
              const isActive = bet?.status === 'active';
              const isLong = box.direction === 'long';
              const isWinning = bet && recentWins.has(bet.id);
              const isLosing = bet && recentLosses.has(bet.id);

              // Calculate time remaining for active bet
              let timeRemaining = 0;
              if (isActive && bet) {
                timeRemaining = Math.max(0, Math.ceil((bet.expiresAt - Date.now()) / 1000));
              }

              return (
                <motion.button
                  key={box.id}
                  className={`
                    relative flex flex-col items-center justify-center
                    border transition-all duration-100
                    ${!bet && isLong && 'border-green-500/20 bg-green-500/5 hover:bg-green-500/20 hover:border-green-500/50'}
                    ${!bet && !isLong && 'border-red-500/20 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/50'}
                    ${isActive && !isWinning && !isLosing && 'bg-yellow-400/90 border-yellow-400'}
                    ${isWinning && 'bg-green-400 border-green-400 animate-pulse'}
                    ${isLosing && 'bg-red-500 border-red-500 animate-pulse'}
                  `}
                  style={{
                    gridRow: box.row + 1,
                    gridColumn: box.col + 1,
                    boxShadow: isActive ? '0 0 20px rgba(250,204,21,0.5)' :
                               isWinning ? '0 0 30px rgba(34,197,94,0.8)' :
                               isLosing ? '0 0 30px rgba(239,68,68,0.8)' : 'none',
                  }}
                  whileTap={!bet ? { scale: 0.92 } : undefined}
                  onClick={() => !bet && onTap(box)}
                  disabled={!!bet}
                >
                  <span className={`text-xs font-bold ${
                    isActive || isWinning || isLosing ? 'text-black' :
                    isLong ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {box.multiplier.toFixed(1)}x
                  </span>
                  {isActive && bet && !isWinning && !isLosing && (
                    <>
                      <span className="text-[9px] text-black font-bold">${bet.stake}</span>
                      <span className="text-[8px] text-black/70">{timeRemaining}s</span>
                    </>
                  )}
                  {isWinning && (
                    <span className="text-[10px] text-black font-bold">WIN!</span>
                  )}
                  {isLosing && (
                    <span className="text-[10px] text-white font-bold">LOST</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Time labels */}
          <div className="h-7 flex shrink-0 border-t border-white/10">
            {timeWindows.map((tw) => (
              <div
                key={tw}
                className="flex-1 flex items-center justify-center text-[10px] text-gray-500 font-medium"
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
