'use client';

import { useEffect, useCallback } from 'react';
import { TapBet } from '@/lib/tap/types';
import { playSound } from '@/lib/tap/sounds';

interface UseBetMonitorOptions {
  bets: TapBet[];
  currentPrice: number;
  onBetWon: (bet: TapBet) => void;
  onBetLost: (bet: TapBet) => void;
}

export function useBetMonitor({
  bets,
  currentPrice,
  onBetWon,
  onBetLost,
}: UseBetMonitorOptions) {
  const checkBets = useCallback(() => {
    if (!currentPrice || currentPrice === 0) return;

    const now = Date.now();

    bets.forEach(bet => {
      if (bet.status !== 'active') return;

      // Check if price hit target
      const priceHit = bet.direction === 'long'
        ? currentPrice >= bet.targetPrice
        : currentPrice <= bet.targetPrice;

      if (priceHit) {
        playSound('win');
        onBetWon(bet);
        return;
      }

      // Check if bet expired
      if (now >= bet.expiresAt) {
        playSound('lose');
        onBetLost(bet);
      }
    });
  }, [bets, currentPrice, onBetWon, onBetLost]);

  useEffect(() => {
    const interval = setInterval(checkBets, 100); // Check every 100ms
    return () => clearInterval(interval);
  }, [checkBets]);
}
