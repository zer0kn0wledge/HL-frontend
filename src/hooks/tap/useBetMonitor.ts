'use client';

import { useEffect, useCallback, useRef } from 'react';
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
  // Track price extremes for each bet to detect actual price movement
  const priceExtremesRef = useRef<Map<string, { high: number; low: number }>>(new Map());

  const checkBets = useCallback(() => {
    if (!currentPrice || currentPrice === 0) return;

    const now = Date.now();

    bets.forEach(bet => {
      if (bet.status !== 'active') return;

      // Initialize or update price tracking for this bet
      let extremes = priceExtremesRef.current.get(bet.id);
      if (!extremes) {
        extremes = { high: bet.entryPrice, low: bet.entryPrice };
        priceExtremesRef.current.set(bet.id, extremes);
      }

      // Update extremes
      extremes.high = Math.max(extremes.high, currentPrice);
      extremes.low = Math.min(extremes.low, currentPrice);

      // Calculate price distance needed
      const priceDistance = Math.abs(bet.targetPrice - bet.entryPrice);

      // Check if price hit target
      // For LONG: price must have gone UP from entry to reach target
      // For SHORT: price must have gone DOWN from entry to reach target
      let priceHit = false;

      if (bet.direction === 'long') {
        // Target is above entry - need price to reach UP to target
        // Check if highest price reached the target
        priceHit = extremes.high >= bet.targetPrice;
      } else {
        // Target is below entry - need price to reach DOWN to target
        // Check if lowest price reached the target
        priceHit = extremes.low <= bet.targetPrice;
      }

      if (priceHit) {
        // Clean up tracking
        priceExtremesRef.current.delete(bet.id);
        playSound('win');
        onBetWon(bet);
        return;
      }

      // Check if bet expired (time ran out without hitting target)
      if (now >= bet.expiresAt) {
        // Clean up tracking
        priceExtremesRef.current.delete(bet.id);
        playSound('lose');
        onBetLost(bet);
      }
    });
  }, [bets, currentPrice, onBetWon, onBetLost]);

  // Clean up stale entries when bets change
  useEffect(() => {
    const activeBetIds = new Set(bets.filter(b => b.status === 'active').map(b => b.id));
    priceExtremesRef.current.forEach((_, id) => {
      if (!activeBetIds.has(id)) {
        priceExtremesRef.current.delete(id);
      }
    });
  }, [bets]);

  useEffect(() => {
    const interval = setInterval(checkBets, 100); // Check every 100ms
    return () => clearInterval(interval);
  }, [checkBets]);
}
