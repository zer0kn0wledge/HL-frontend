'use client';

import { motion } from 'framer-motion';
import { BET_PRESETS } from '@/lib/tap/constants';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface BetControlsProps {
  betAmount: number;
  balance: number;
  sessionPnL: number;
  activeBetsCount: number;
  onBetAmountChange: (amount: number) => void;
}

export function BetControls({
  betAmount,
  balance,
  sessionPnL,
  activeBetsCount,
  onBetAmountChange,
}: BetControlsProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-[#0a0f1a] border-t border-white/5">
      {/* Stats row */}
      <div className="flex items-center justify-between">
        {/* Balance */}
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#50E3C2]" />
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="font-mono font-bold text-white">
            ${balance.toFixed(2)}
          </span>
        </div>

        {/* Session PnL */}
        <div className="flex items-center gap-2">
          {sessionPnL >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className="text-sm text-gray-400">PnL:</span>
          <span
            className={`font-mono font-bold ${
              sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toFixed(2)}
          </span>
        </div>

        {/* Active bets */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Active:</span>
          <span className="font-mono font-bold text-[#50E3C2]">
            {activeBetsCount}
          </span>
        </div>
      </div>

      {/* Bet amount selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Bet Amount</span>
          <span className="font-mono text-white font-bold">${betAmount}</span>
        </div>

        <div className="flex gap-2">
          {BET_PRESETS.map((preset) => (
            <motion.button
              key={preset}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                betAmount === preset
                  ? 'bg-[#50E3C2] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              whileTap={{ scale: 0.95 }}
              onClick={() => onBetAmountChange(preset)}
            >
              ${preset}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-gray-500">
        Tap a box above to bet LONG or below to bet SHORT
      </div>
    </div>
  );
}
