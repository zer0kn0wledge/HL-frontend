'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { TapBet } from '@/lib/tap/types';

interface WinCelebrationProps {
  bet: TapBet | null;
  onComplete: () => void;
}

export function WinCelebration({ bet, onComplete }: WinCelebrationProps) {
  useEffect(() => {
    if (bet) {
      // Fire confetti
      const duration = 2000;
      const end = Date.now() + duration;

      const colors = bet.direction === 'long'
        ? ['#22C55E', '#4ADE80', '#86EFAC']
        : ['#EF4444', '#F87171', '#FCA5A5'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Auto-dismiss after animation
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [bet, onComplete]);

  return (
    <AnimatePresence>
      {bet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-[#0a0f1a] to-black rounded-2xl border border-[#FACC15]/50 shadow-[0_0_60px_rgba(250,204,21,0.3)]"
          >
            {/* Win emoji */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-6xl"
            >
              🎉
            </motion.div>

            {/* Win text */}
            <div className="text-center">
              <h2 className="text-3xl font-black text-[#FACC15] mb-1">YOU WON!</h2>
              <p className="text-gray-400">
                {bet.direction === 'long' ? '🚀 Long' : '📉 Short'} hit target!
              </p>
            </div>

            {/* Winnings */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-gray-400">Winnings</span>
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-4xl font-black text-green-400"
              >
                +${(bet.stake * bet.multiplier - bet.stake).toFixed(2)}
              </motion.span>
              <span className="text-sm text-gray-500">
                {bet.multiplier.toFixed(1)}x multiplier
              </span>
            </div>

            {/* Tap to dismiss */}
            <p className="text-xs text-gray-500 mt-2">Tap to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
