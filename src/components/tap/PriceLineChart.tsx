'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PricePoint, TapBet } from '@/lib/tap/types';

interface PriceLineChartProps {
  priceHistory: PricePoint[];
  currentPrice: number;
  activeBets: TapBet[];
  height?: number;
}

export function PriceLineChart({
  priceHistory,
  currentPrice,
  activeBets,
  height = 120,
}: PriceLineChartProps) {
  const { path, minPrice, maxPrice, priceRange } = useMemo(() => {
    if (priceHistory.length < 2) {
      return { path: '', minPrice: 0, maxPrice: 0, priceRange: 0 };
    }

    const prices = priceHistory.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    // Add padding
    const padding = range * 0.1;
    const adjustedMin = min - padding;
    const adjustedMax = max + padding;
    const adjustedRange = adjustedMax - adjustedMin;

    const width = 100;
    const points = priceHistory.map((point, i) => {
      const x = (i / (priceHistory.length - 1)) * width;
      const y = height - ((point.price - adjustedMin) / adjustedRange) * height;
      return `${x},${y}`;
    });

    return {
      path: `M${points.join(' L')}`,
      minPrice: adjustedMin,
      maxPrice: adjustedMax,
      priceRange: adjustedRange,
    };
  }, [priceHistory, height]);

  // Calculate Y positions for bet lines
  const betLines = useMemo(() => {
    if (!priceRange) return [];

    return activeBets.map(bet => {
      const y = height - ((bet.targetPrice - minPrice) / priceRange) * height;
      return {
        bet,
        y: Math.max(0, Math.min(height, y)),
      };
    });
  }, [activeBets, minPrice, priceRange, height]);

  if (priceHistory.length < 2) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-[#0a0f1a] rounded-xl border border-white/5"
      >
        <span className="text-gray-500 text-sm">Waiting for price data...</span>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="relative bg-[#0a0f1a] rounded-xl border border-white/5 overflow-hidden"
    >
      {/* SVG Chart */}
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(80, 227, 194, 0.3)" />
            <stop offset="100%" stopColor="rgba(80, 227, 194, 0)" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={`${path} L100,${height} L0,${height} Z`}
          fill="url(#priceGradient)"
        />

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke="#50E3C2"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Bet target lines */}
        {betLines.map(({ bet, y }) => (
          <line
            key={bet.id}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke={bet.direction === 'long' ? '#22C55E' : '#EF4444'}
            strokeWidth="1"
            strokeDasharray="4,4"
            vectorEffect="non-scaling-stroke"
            opacity="0.6"
          />
        ))}
      </svg>

      {/* Current price indicator */}
      <motion.div
        className="absolute right-2 px-2 py-0.5 bg-[#50E3C2] text-black text-xs font-bold rounded"
        style={{
          top: `${height - ((currentPrice - minPrice) / priceRange) * height}px`,
          transform: 'translateY(-50%)',
        }}
        key={currentPrice}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
      >
        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </motion.div>

      {/* Bet indicators on right side */}
      {betLines.map(({ bet, y }) => (
        <div
          key={bet.id}
          className={`absolute right-2 px-1.5 py-0.5 text-[10px] font-bold rounded ${
            bet.direction === 'long'
              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
              : 'bg-red-500/20 text-red-400 border border-red-500/40'
          }`}
          style={{
            top: `${y}px`,
            transform: 'translateY(-50%)',
          }}
        >
          ${bet.targetPrice.toLocaleString()}
        </div>
      ))}
    </div>
  );
}
