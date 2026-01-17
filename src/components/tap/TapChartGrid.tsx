'use client';

import { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Number of price rows above and below current price
const ROWS_ABOVE = 8;
const ROWS_BELOW = 8;
const TIME_COLUMNS = GRID_CONFIG.timeWindows;

export const TapChartGrid = memo(function TapChartGrid({
  currentPrice,
  priceHistory,
  asset,
  activeBets,
  onTap,
}: TapChartGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const increment = getPriceIncrement(asset);

  // Generate price levels centered around current price
  const priceLevels = useMemo(() => {
    if (!currentPrice) return [];
    const basePrice = Math.round(currentPrice / increment) * increment;
    const levels: number[] = [];

    // Above current price (LONG targets)
    for (let i = ROWS_ABOVE; i >= 1; i--) {
      levels.push(basePrice + i * increment);
    }

    // Below current price (SHORT targets)
    for (let i = 1; i <= ROWS_BELOW; i++) {
      levels.push(basePrice - i * increment);
    }

    return levels;
  }, [currentPrice, increment]);

  // Calculate row height and column width
  const rowHeight = dimensions.height / (ROWS_ABOVE + ROWS_BELOW);
  const colWidth = (dimensions.width - 70) / TIME_COLUMNS.length; // 70px for price labels

  // Find current price position
  const currentPriceY = useMemo(() => {
    if (!currentPrice || priceLevels.length === 0) return dimensions.height / 2;

    const basePrice = Math.round(currentPrice / increment) * increment;
    const topPrice = basePrice + ROWS_ABOVE * increment;
    const priceRange = (ROWS_ABOVE + ROWS_BELOW) * increment;
    const priceOffset = topPrice - currentPrice;

    return (priceOffset / priceRange) * dimensions.height;
  }, [currentPrice, priceLevels, increment, dimensions.height]);

  // Generate grid boxes
  const gridBoxes = useMemo(() => {
    if (!currentPrice) return [];

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

  // Get bet for a specific box
  const getBetForBox = useCallback((price: number, direction: 'long' | 'short') => {
    return activeBets.find(
      b => Math.abs(b.targetPrice - price) < increment * 0.1 && b.direction === direction
    );
  }, [activeBets, increment]);

  // Draw price line on canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceHistory.length < 2 || !dimensions.width) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate price range for chart
    const basePrice = Math.round(currentPrice / increment) * increment;
    const topPrice = basePrice + ROWS_ABOVE * increment;
    const bottomPrice = basePrice - ROWS_BELOW * increment;
    const priceRange = topPrice - bottomPrice;

    // Map price to Y coordinate
    const priceToY = (p: number) => {
      return ((topPrice - p) / priceRange) * canvas.height;
    };

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = '#50E3C2';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#50E3C2';
    ctx.shadowBlur = 10;

    const startIdx = Math.max(0, priceHistory.length - 100);
    const visibleHistory = priceHistory.slice(startIdx);
    const timeRange = visibleHistory[visibleHistory.length - 1]?.time - visibleHistory[0]?.time || 1;

    visibleHistory.forEach((point, i) => {
      const x = 70 + ((point.time - visibleHistory[0].time) / timeRange) * (canvas.width - 70);
      const y = priceToY(point.price);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw glow effect
    ctx.shadowBlur = 0;

  }, [priceHistory, dimensions, currentPrice, increment]);

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Waiting for price data...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {/* Grid background lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ left: 70 }}>
        {/* Horizontal grid lines */}
        {priceLevels.map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * rowHeight}
            x2="100%"
            y2={i * rowHeight}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        {/* Vertical grid lines */}
        {TIME_COLUMNS.map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * colWidth}
            y1="0"
            x2={i * colWidth}
            y2="100%"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Price line canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      />

      {/* Price labels (Y-axis) */}
      <div className="absolute left-0 top-0 bottom-0 w-[70px] flex flex-col z-10">
        {priceLevels.map((price, i) => {
          const isLong = price > currentPrice;
          return (
            <div
              key={price}
              className="flex-1 flex items-center justify-end pr-2 text-[10px] font-mono"
              style={{ color: isLong ? '#22C55E' : '#EF4444' }}
            >
              ${price.toLocaleString()}
            </div>
          );
        })}
      </div>

      {/* Current price indicator */}
      <motion.div
        className="absolute right-0 z-20 flex items-center"
        style={{ top: currentPriceY - 12, left: 0 }}
        animate={{ top: currentPriceY - 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="w-[70px] flex justify-end pr-1">
          <span className="px-2 py-1 bg-[#50E3C2] text-black text-[10px] font-bold rounded">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex-1 h-[2px] bg-[#50E3C2] shadow-[0_0_10px_#50E3C2]" />
      </motion.div>

      {/* Grid boxes */}
      <div
        className="absolute top-0 bottom-0 right-0"
        style={{ left: 70 }}
      >
        {gridBoxes.map((box) => {
          const bet = getBetForBox(box.price, box.direction);
          const isActive = bet?.status === 'active';
          const isLong = box.direction === 'long';

          return (
            <motion.button
              key={box.id}
              className={`absolute flex flex-col items-center justify-center border transition-all
                ${!bet && isLong && 'border-green-500/20 hover:bg-green-500/20 hover:border-green-500/50'}
                ${!bet && !isLong && 'border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50'}
                ${isActive && isLong && 'bg-yellow-400 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]'}
                ${isActive && !isLong && 'bg-yellow-400 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]'}
              `}
              style={{
                left: box.col * colWidth,
                top: box.row * rowHeight,
                width: colWidth - 2,
                height: rowHeight - 2,
                margin: 1,
              }}
              whileTap={!bet ? { scale: 0.95 } : undefined}
              onClick={() => !bet && onTap(box)}
              disabled={!!bet}
            >
              <span className={`text-xs font-bold ${isActive ? 'text-black' : isLong ? 'text-green-400' : 'text-red-400'}`}>
                {box.multiplier.toFixed(1)}x
              </span>
              {isActive && bet && (
                <span className="text-[9px] text-black font-bold">
                  ${bet.stake}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Time labels (X-axis) */}
      <div
        className="absolute bottom-0 h-6 flex z-10 bg-black/80"
        style={{ left: 70, right: 0 }}
      >
        {TIME_COLUMNS.map((tw, i) => (
          <div
            key={tw}
            className="flex-1 flex items-center justify-center text-[10px] text-gray-500 font-medium"
          >
            {TIME_LABELS[tw]}
          </div>
        ))}
      </div>
    </div>
  );
});
