'use client';

import { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GridBox, TapBet, PricePoint } from '@/lib/tap/types';
import { GRID_CONFIG, TIME_LABELS } from '@/lib/tap/constants';
import { getPriceIncrement, calculateMultiplier } from '@/lib/tap/multiplierCalculator';

interface TapChartGridProps {
  currentPrice: number;
  priceHistory: PricePoint[];
  asset: string;
  activeBets: TapBet[];
  onTap: (box: GridBox) => void;
}

const ROWS_ABOVE = 6;
const ROWS_BELOW = 6;
const TIME_COLUMNS = GRID_CONFIG.timeWindows;

export const TapChartGrid = memo(function TapChartGrid({
  currentPrice,
  priceHistory,
  asset,
  activeBets,
  onTap,
}: TapChartGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const increment = getPriceIncrement(asset);

  // Generate price levels centered around current price
  const priceLevels = useMemo(() => {
    if (!currentPrice) return [];
    const basePrice = Math.round(currentPrice / increment) * increment;
    const levels: number[] = [];

    // Above current price (LONG targets) - from highest to lowest
    for (let i = ROWS_ABOVE; i >= 1; i--) {
      levels.push(basePrice + i * increment);
    }

    // Below current price (SHORT targets) - from highest to lowest
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

      TIME_COLUMNS.forEach((timeWindow, colIndex) => {
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
  }, [currentPrice, priceLevels]);

  // Get bet for a specific box
  const getBetForBox = useCallback((price: number, direction: 'long' | 'short') => {
    return activeBets.find(
      b => Math.abs(b.targetPrice - price) < increment * 0.1 && b.direction === direction
    );
  }, [activeBets, increment]);

  // Draw price line on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid || priceHistory.length < 2 || !currentPrice) return;

    const rect = grid.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate price range for chart
    const basePrice = Math.round(currentPrice / increment) * increment;
    const topPrice = basePrice + ROWS_ABOVE * increment;
    const bottomPrice = basePrice - ROWS_BELOW * increment;
    const priceRange = topPrice - bottomPrice;

    const priceToY = (p: number) => {
      return ((topPrice - p) / priceRange) * canvas.height;
    };

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = '#50E3C2';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const startIdx = Math.max(0, priceHistory.length - 100);
    const visibleHistory = priceHistory.slice(startIdx);
    const timeRange = visibleHistory[visibleHistory.length - 1]?.time - visibleHistory[0]?.time || 1;

    visibleHistory.forEach((point, i) => {
      const x = ((point.time - visibleHistory[0].time) / timeRange) * canvas.width;
      const y = priceToY(point.price);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Glow effect
    ctx.shadowColor = '#50E3C2';
    ctx.shadowBlur = 15;
    ctx.stroke();

  }, [priceHistory, currentPrice, increment]);

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-gray-500 text-lg">Connecting to price feed...</div>
      </div>
    );
  }

  const totalRows = ROWS_ABOVE + ROWS_BELOW;

  return (
    <div className="relative w-full h-full bg-black flex">
      {/* Price labels (Y-axis) */}
      <div className="w-16 flex flex-col shrink-0">
        {priceLevels.map((price, i) => {
          const isLong = price > currentPrice;
          return (
            <div
              key={`price-${price}`}
              className="flex-1 flex items-center justify-end pr-2 text-[11px] font-mono border-b border-white/5"
              style={{ color: isLong ? '#22C55E' : '#EF4444' }}
            >
              ${price.toLocaleString()}
            </div>
          );
        })}
        {/* Empty space for time labels */}
        <div className="h-8 shrink-0" />
      </div>

      {/* Main grid area */}
      <div className="flex-1 flex flex-col relative">
        {/* Grid with boxes */}
        <div
          ref={gridRef}
          className="flex-1 relative"
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${totalRows}, 1fr)`,
            gridTemplateColumns: `repeat(${TIME_COLUMNS.length}, 1fr)`,
            gap: '2px',
          }}
        >
          {/* Canvas for price line */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-10"
          />

          {/* Current price indicator line */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-[#50E3C2] z-20 shadow-[0_0_10px_#50E3C2]"
            style={{
              top: `${(ROWS_ABOVE / totalRows) * 100}%`,
            }}
          >
            <div className="absolute right-0 -top-3 px-2 py-1 bg-[#50E3C2] text-black text-[10px] font-bold rounded-l">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Grid boxes */}
          {gridBoxes.flat().map((box) => {
            const bet = getBetForBox(box.price, box.direction);
            const isActive = bet?.status === 'active';
            const isLong = box.direction === 'long';

            return (
              <motion.button
                key={box.id}
                className={`
                  relative flex flex-col items-center justify-center
                  border rounded transition-all duration-150
                  ${!bet && isLong && 'border-green-500/30 bg-green-500/10 hover:bg-green-500/25 hover:border-green-500/60'}
                  ${!bet && !isLong && 'border-red-500/30 bg-red-500/10 hover:bg-red-500/25 hover:border-red-500/60'}
                  ${isActive && 'bg-yellow-400 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]'}
                `}
                style={{
                  gridRow: box.row + 1,
                  gridColumn: box.col + 1,
                }}
                whileTap={!bet ? { scale: 0.92 } : undefined}
                onClick={() => !bet && onTap(box)}
                disabled={!!bet}
              >
                <span className={`text-sm font-bold ${isActive ? 'text-black' : isLong ? 'text-green-400' : 'text-red-400'}`}>
                  {box.multiplier.toFixed(1)}x
                </span>
                {isActive && bet && (
                  <span className="text-[10px] text-black font-bold">
                    ${bet.stake}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Time labels (X-axis) */}
        <div className="h-8 flex shrink-0 border-t border-white/10">
          {TIME_COLUMNS.map((tw) => (
            <div
              key={tw}
              className="flex-1 flex items-center justify-center text-[11px] text-gray-500 font-medium"
            >
              {TIME_LABELS[tw]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
