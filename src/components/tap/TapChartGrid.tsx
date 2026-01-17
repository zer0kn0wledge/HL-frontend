'use client';

import { memo, useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridBox, TapBet, PricePoint } from '@/lib/tap/types';
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

const NUM_ROWS = 8; // Keep it tight for price movement visibility

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

  const [priceZoom, setPriceZoom] = useState(2); // Start more zoomed in
  const [timePreset, setTimePreset] = useState(0);
  const [poppedBoxes, setPoppedBoxes] = useState<Map<string, 'win' | 'lose'>>(new Map());
  const [elapsedTime, setElapsedTime] = useState(0);

  const increment = getPriceIncrement(asset) / priceZoom;
  const timeWindows = TIME_PRESETS[timePreset].windows;

  // Track elapsed time for column fading
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [timePreset]);

  // Generate price levels centered around current price (tight range)
  const priceLevels = useMemo(() => {
    if (!currentPrice) return [];
    const basePrice = Math.round(currentPrice / increment) * increment;
    const levels: number[] = [];
    const halfRows = Math.floor(NUM_ROWS / 2);

    for (let i = halfRows; i >= 1; i--) {
      levels.push(basePrice + i * increment);
    }
    for (let i = 0; i < halfRows; i++) {
      levels.push(basePrice - i * increment);
    }

    return levels;
  }, [currentPrice, increment]);

  // Generate grid boxes - time windows represent FUTURE time from now
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
  const getBetForBox = useCallback((boxId: string) => {
    return activeBets.find(b => b.id.includes(boxId.split('-').slice(0, 3).join('-')));
  }, [activeBets]);

  // Check for wins/losses and trigger pop effects
  useEffect(() => {
    activeBets.forEach(bet => {
      if (bet.status === 'active') {
        const priceHit = bet.direction === 'long'
          ? currentPrice >= bet.targetPrice
          : currentPrice <= bet.targetPrice;

        if (priceHit && !poppedBoxes.has(bet.id)) {
          // Trigger win pop
          setPoppedBoxes(prev => new Map(prev).set(bet.id, 'win'));
          setTimeout(() => {
            setPoppedBoxes(prev => {
              const next = new Map(prev);
              next.delete(bet.id);
              return next;
            });
          }, 2000);
        }

        if (Date.now() >= bet.expiresAt && !poppedBoxes.has(bet.id)) {
          // Trigger lose pop
          setPoppedBoxes(prev => new Map(prev).set(bet.id, 'lose'));
          setTimeout(() => {
            setPoppedBoxes(prev => {
              const next = new Map(prev);
              next.delete(bet.id);
              return next;
            });
          }, 2000);
        }
      }
    });
  }, [activeBets, currentPrice, poppedBoxes]);

  // Animated price line - comes from LEFT
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
      const halfRows = Math.floor(NUM_ROWS / 2);
      const topPrice = basePrice + halfRows * increment;
      const bottomPrice = basePrice - (halfRows - 1) * increment;
      const priceRange = topPrice - bottomPrice;

      const priceToY = (p: number) => {
        const clamped = Math.max(bottomPrice, Math.min(topPrice, p));
        return ((topPrice - clamped) / priceRange) * canvas.height;
      };

      // Price line comes from LEFT - show last 30 seconds ending at left edge
      const now = Date.now();
      const historyWindowMs = 30000;
      const visibleHistory = priceHistory.filter(p => now - p.time < historyWindowMs);

      if (visibleHistory.length < 2) return;

      // The price line ends at the LEFT edge (around 15% of width)
      const lineEndX = canvas.width * 0.12;

      // Draw gradient fill under price line
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(80, 227, 194, 0.1)');
      gradient.addColorStop(0.5, 'rgba(80, 227, 194, 0.05)');
      gradient.addColorStop(1, 'rgba(80, 227, 194, 0)');

      ctx.beginPath();
      visibleHistory.forEach((point, i) => {
        // Map time so newest point is at lineEndX
        const age = now - point.time;
        const x = lineEndX - (age / historyWindowMs) * lineEndX;
        const y = priceToY(point.price);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      // Complete fill path
      ctx.lineTo(lineEndX, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw price line with glow
      ctx.beginPath();
      ctx.strokeStyle = '#50E3C2';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#50E3C2';
      ctx.shadowBlur = 15;

      visibleHistory.forEach((point, i) => {
        const age = now - point.time;
        const x = lineEndX - (age / historyWindowMs) * lineEndX;
        const y = priceToY(point.price);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw current price dot at the leading edge
      if (visibleHistory.length > 0) {
        const lastPoint = visibleHistory[visibleHistory.length - 1];
        const y = priceToY(lastPoint.price);

        // Pulsing glow effect
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.3;

        ctx.beginPath();
        ctx.arc(lineEndX, y, 8 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#50E3C2';
        ctx.shadowBlur = 25 * pulse;
        ctx.fill();

        // Inner dot
        ctx.beginPath();
        ctx.arc(lineEndX, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
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
  }, [priceHistory, currentPrice, increment]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  // Calculate column opacity based on elapsed time
  const getColumnOpacity = (colIndex: number) => {
    const timeWindow = timeWindows[colIndex];
    // First column fades after its time window passes
    if (elapsedTime > timeWindow) {
      return Math.max(0.1, 1 - (elapsedTime - timeWindow) / timeWindow);
    }
    return 1;
  };

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-gray-500 text-lg">Connecting to price feed...</div>
      </div>
    );
  }

  // Calculate box size to make them square
  const boxSize = `min(calc((100% - ${timeWindows.length - 1}px) / ${timeWindows.length}), calc((100% - ${NUM_ROWS - 1}px) / ${NUM_ROWS}))`;

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
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
            onClick={() => setPriceZoom(z => Math.min(5, z * 1.5))}
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

      <div className="flex-1 flex min-h-0">
        {/* Price labels (Y-axis) - on the LEFT */}
        <div className="w-16 flex flex-col shrink-0">
          {priceLevels.map((price) => {
            const isAbove = price > currentPrice;
            const isCurrent = Math.abs(price - currentPrice) < increment * 0.5;
            return (
              <div
                key={`price-${price}`}
                className={`flex-1 flex items-center justify-end pr-2 text-[10px] font-mono border-b border-white/5 ${
                  isCurrent ? 'bg-[#50E3C2]/20' : ''
                }`}
                style={{ color: isCurrent ? '#50E3C2' : isAbove ? '#22C55E' : '#EF4444' }}
              >
                ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            );
          })}
          <div className="h-8 shrink-0" />
        </div>

        {/* Main grid area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <div
            ref={gridRef}
            className="flex-1 relative"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${NUM_ROWS}, 1fr)`,
              gridTemplateColumns: `repeat(${timeWindows.length}, 1fr)`,
              gap: '2px',
              aspectRatio: `${timeWindows.length} / ${NUM_ROWS}`,
              margin: 'auto 0',
            }}
          >
            {/* Canvas for price line */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none z-10"
            />

            {/* Grid boxes */}
            {gridBoxes.flat().map((box) => {
              // Find matching bet by price, direction, and approximate time window
              const bet = activeBets.find(b => {
                const betDuration = Math.round((b.expiresAt - b.placedAt) / 1000);
                return Math.abs(b.targetPrice - box.price) < increment * 0.5 &&
                  b.direction === box.direction &&
                  Math.abs(betDuration - box.timeWindow) < box.timeWindow * 0.3;
              });
              const isActive = bet?.status === 'active';
              const isLong = box.direction === 'long';
              const popState = bet ? poppedBoxes.get(bet.id) : undefined;
              const opacity = getColumnOpacity(box.col);

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
                    border transition-all duration-150 aspect-square
                    ${!bet && isLong && 'border-green-500/30 bg-green-500/10 hover:bg-green-500/30 hover:border-green-500/60 hover:scale-105'}
                    ${!bet && !isLong && 'border-red-500/30 bg-red-500/10 hover:bg-red-500/30 hover:border-red-500/60 hover:scale-105'}
                    ${isActive && !popState && 'bg-yellow-400/90 border-yellow-400 scale-105'}
                  `}
                  style={{
                    gridRow: box.row + 1,
                    gridColumn: box.col + 1,
                    opacity: popState ? 1 : opacity,
                    boxShadow: isActive && !popState ? '0 0 25px rgba(250,204,21,0.6)' : 'none',
                  }}
                  initial={false}
                  animate={popState === 'win' ? {
                    scale: [1, 1.8, 0],
                    opacity: [1, 1, 0],
                    backgroundColor: ['#22C55E', '#22C55E', '#22C55E'],
                  } : popState === 'lose' ? {
                    scale: [1, 1.3, 0],
                    opacity: [1, 1, 0],
                    backgroundColor: ['#EF4444', '#EF4444', '#EF4444'],
                    rotate: [0, 10, -10, 0],
                  } : {}}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  whileTap={!bet ? { scale: 0.9 } : undefined}
                  onClick={() => !bet && onTap(box)}
                  disabled={!!bet || opacity < 0.3}
                >
                  {/* Win explosion effect */}
                  {popState === 'win' && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ backgroundColor: '#22C55E', boxShadow: '0 0 60px #22C55E' }}
                      />
                      <span className="text-2xl z-10">💰</span>
                    </>
                  )}

                  {/* Lose shake effect */}
                  {popState === 'lose' && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ backgroundColor: '#EF4444', boxShadow: '0 0 40px #EF4444' }}
                      />
                      <span className="text-2xl z-10">💥</span>
                    </>
                  )}

                  {/* Normal box content */}
                  {!popState && (
                    <>
                      <span className={`text-sm font-bold ${
                        isActive ? 'text-black' :
                        isLong ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {box.multiplier.toFixed(1)}x
                      </span>
                      {isActive && bet && (
                        <>
                          <span className="text-[10px] text-black font-bold">${bet.stake}</span>
                          <span className="text-[9px] text-black/70">{timeRemaining}s</span>
                        </>
                      )}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Time labels - these represent FUTURE time windows */}
          <div className="h-8 flex shrink-0 border-t border-white/10">
            {timeWindows.map((tw, i) => (
              <div
                key={tw}
                className="flex-1 flex items-center justify-center text-[11px] text-gray-400 font-medium"
                style={{ opacity: getColumnOpacity(i) }}
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
