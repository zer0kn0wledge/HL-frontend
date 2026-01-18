'use client';

import { motion } from 'framer-motion';
import { BET_PRESETS } from '@/lib/tap/constants';
import { Wallet, TrendingUp } from 'lucide-react';

interface BetControlsProps {
  betAmount: number;
  balance: number;
  sessionPnL: number;
  activeBetsCount: number;
  onBetAmountChange: (amount: number) => void;
  isDemoMode?: boolean;
}

export function BetControls({
  betAmount,
  balance,
  sessionPnL,
  activeBetsCount,
  onBetAmountChange,
  isDemoMode = false,
}: BetControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-black/90 border-t border-white/10 backdrop-blur-sm">
      {/* Balance - Left */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
        isDemoMode ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5'
      }`}>
        <Wallet className={`w-4 h-4 ${isDemoMode ? 'text-yellow-400' : 'text-[#50E3C2]'}`} />
        <span className={`font-mono font-bold text-sm ${isDemoMode ? 'text-yellow-400' : 'text-white'}`}>
          ${balance.toFixed(2)}
        </span>
        {isDemoMode && (
          <span className="text-[10px] text-yellow-500/70 uppercase font-medium">demo</span>
        )}
      </div>

      {/* Bet amount selector - Center */}
      <div className="flex items-center gap-1">
        {BET_PRESETS.map((preset) => (
          <motion.button
            key={preset}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              betAmount === preset
                ? 'bg-[#50E3C2] text-black shadow-[0_0_15px_rgba(80,227,194,0.4)]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBetAmountChange(preset)}
          >
            ${preset}
          </motion.button>
        ))}
      </div>

      {/* PnL and Active bets - Right */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full">
          <TrendingUp className={`w-4 h-4 ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
          <span className={`font-mono font-bold text-sm ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toFixed(2)}
          </span>
        </div>

        {activeBetsCount > 0 && (
          <div className="flex items-center gap-1.5 bg-yellow-400/20 px-3 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="font-mono font-bold text-yellow-400 text-sm">
              {activeBetsCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
