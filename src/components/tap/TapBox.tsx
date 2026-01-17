'use client';

import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GridBox, TapBet } from '@/lib/tap/types';

interface TapBoxProps {
  box: GridBox;
  bet?: TapBet;
  onTap: () => void;
}

export const TapBox = memo(function TapBox({ box, bet, onTap }: TapBoxProps) {
  const isLong = box.direction === 'long';
  const hasBet = !!bet;
  const isActive = bet?.status === 'active';
  const [timePercent, setTimePercent] = useState(100);

  // Update countdown timer
  useEffect(() => {
    if (!isActive || !bet) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, bet.expiresAt - Date.now());
      const total = bet.expiresAt - bet.placedAt;
      setTimePercent((remaining / total) * 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, bet]);

  return (
    <motion.button
      className={`
        relative flex flex-col items-center justify-center
        min-w-[52px] min-h-[44px] rounded-lg border transition-all duration-150
        ${!hasBet && isLong && 'border-green-500/20 bg-green-500/5 hover:bg-green-500/15 hover:border-green-500/40 active:scale-95'}
        ${!hasBet && !isLong && 'border-red-500/20 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/40 active:scale-95'}
        ${isActive && isLong && 'border-green-500 bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.4)]'}
        ${isActive && !isLong && 'border-red-500 bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.4)]'}
        ${hasBet && !isActive && 'opacity-50 cursor-not-allowed'}
      `}
      whileTap={!hasBet ? { scale: 0.92 } : undefined}
      onClick={!hasBet ? onTap : undefined}
      disabled={hasBet}
    >
      {/* Countdown progress bar (bottom border) */}
      {isActive && (
        <motion.div
          className={`absolute bottom-0 left-0 h-0.5 ${isLong ? 'bg-green-400' : 'bg-red-400'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${timePercent}%` }}
          transition={{ duration: 0.1 }}
        />
      )}

      {/* Multiplier */}
      <span className={`text-sm font-bold ${isLong ? 'text-green-400' : 'text-red-400'}`}>
        {box.multiplier.toFixed(1)}x
      </span>

      {/* Target price indicator */}
      <span className="text-[9px] text-gray-500 mt-0.5">
        ${box.price.toLocaleString()}
      </span>
    </motion.button>
  );
});
