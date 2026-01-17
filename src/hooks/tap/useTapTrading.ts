'use client';

import { useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import { TapTradingState, TapTradingAction, TapBet, GridBox } from '@/lib/tap/types';
import { DEFAULT_BET_AMOUNT } from '@/lib/tap/constants';
import { generateGridBoxes } from '@/lib/tap/multiplierCalculator';
import { usePriceStream } from './usePriceStream';
import { useBetMonitor } from './useBetMonitor';
import { useHaptics } from './useHaptics';
import { playSound } from '@/lib/tap/sounds';

const initialState: TapTradingState = {
  asset: 'BTC',
  currentPrice: 0,
  priceHistory: [],
  betAmount: DEFAULT_BET_AMOUNT,
  activeBets: [],
  completedBets: [],
  balance: 100, // Demo balance
  sessionPnL: 0,
  isConnected: false,
};

function reducer(state: TapTradingState, action: TapTradingAction): TapTradingState {
  switch (action.type) {
    case 'SET_ASSET':
      return { ...state, asset: action.payload };

    case 'SET_PRICE':
      return { ...state, currentPrice: action.payload };

    case 'ADD_PRICE_HISTORY':
      return {
        ...state,
        priceHistory: [...state.priceHistory.slice(-99), action.payload],
      };

    case 'SET_BET_AMOUNT':
      return { ...state, betAmount: action.payload };

    case 'PLACE_BET':
      return {
        ...state,
        activeBets: [...state.activeBets, action.payload],
        balance: state.balance - action.payload.stake,
      };

    case 'BET_WON': {
      const bet = state.activeBets.find(b => b.id === action.payload.id);
      if (!bet) return state;

      const winnings = bet.stake * bet.multiplier;
      return {
        ...state,
        activeBets: state.activeBets.filter(b => b.id !== action.payload.id),
        completedBets: [...state.completedBets, { ...bet, status: 'won', pnl: winnings - bet.stake }],
        balance: state.balance + winnings,
        sessionPnL: state.sessionPnL + (winnings - bet.stake),
      };
    }

    case 'BET_LOST': {
      const bet = state.activeBets.find(b => b.id === action.payload);
      if (!bet) return state;

      return {
        ...state,
        activeBets: state.activeBets.filter(b => b.id !== action.payload),
        completedBets: [...state.completedBets, { ...bet, status: 'lost', pnl: -bet.stake }],
        sessionPnL: state.sessionPnL - bet.stake,
      };
    }

    case 'SET_BALANCE':
      return { ...state, balance: action.payload };

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    default:
      return state;
  }
}

export function useTapTrading() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { trigger: triggerHaptic } = useHaptics();
  const [lastWin, setLastWin] = useState<TapBet | null>(null);

  // Price stream
  const { currentPrice, priceHistory, isConnected } = usePriceStream({
    asset: state.asset,
  });

  // Update state with price data
  useEffect(() => {
    if (currentPrice !== state.currentPrice && currentPrice > 0) {
      dispatch({ type: 'SET_PRICE', payload: currentPrice });
    }
  }, [currentPrice, state.currentPrice]);

  useEffect(() => {
    dispatch({ type: 'SET_CONNECTED', payload: isConnected });
  }, [isConnected]);

  // Generate grid boxes
  const gridBoxes = useMemo(() => {
    if (!currentPrice) return { longBoxes: [], shortBoxes: [] };
    return generateGridBoxes(currentPrice, state.asset);
  }, [currentPrice, state.asset]);

  // Handle bet win
  const handleBetWon = useCallback((bet: TapBet) => {
    dispatch({ type: 'BET_WON', payload: { id: bet.id, pnl: bet.stake * bet.multiplier } });
    triggerHaptic('success');
    setLastWin(bet);
  }, [triggerHaptic]);

  // Handle bet loss
  const handleBetLost = useCallback((bet: TapBet) => {
    dispatch({ type: 'BET_LOST', payload: bet.id });
    triggerHaptic('error');
  }, [triggerHaptic]);

  // Clear last win
  const clearLastWin = useCallback(() => {
    setLastWin(null);
  }, []);

  // Monitor bets
  useBetMonitor({
    bets: state.activeBets,
    currentPrice,
    onBetWon: handleBetWon,
    onBetLost: handleBetLost,
  });

  // Place a bet
  const placeBet = useCallback((box: GridBox) => {
    if (state.balance < state.betAmount) {
      triggerHaptic('error');
      return false;
    }

    // Check if already have bet at this price
    const existingBet = state.activeBets.find(
      b => b.targetPrice === box.price && b.direction === box.direction
    );
    if (existingBet) {
      triggerHaptic('error');
      return false;
    }

    const bet: TapBet = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      asset: state.asset,
      direction: box.direction,
      stake: state.betAmount,
      targetPrice: box.price,
      entryPrice: currentPrice,
      multiplier: box.multiplier,
      expiresAt: Date.now() + (box.timeWindow * 1000),
      placedAt: Date.now(),
      status: 'active',
    };

    dispatch({ type: 'PLACE_BET', payload: bet });
    playSound('tap');
    triggerHaptic('medium');

    return true;
  }, [state.balance, state.betAmount, state.activeBets, state.asset, currentPrice, triggerHaptic]);

  // Set bet amount
  const setBetAmount = useCallback((amount: number) => {
    dispatch({ type: 'SET_BET_AMOUNT', payload: amount });
  }, []);

  // Set asset
  const setAsset = useCallback((asset: string) => {
    dispatch({ type: 'SET_ASSET', payload: asset });
  }, []);

  return {
    // State
    asset: state.asset,
    currentPrice,
    priceHistory,
    betAmount: state.betAmount,
    activeBets: state.activeBets,
    completedBets: state.completedBets,
    balance: state.balance,
    sessionPnL: state.sessionPnL,
    isConnected,
    gridBoxes,
    lastWin,

    // Actions
    placeBet,
    setBetAmount,
    setAsset,
    clearLastWin,
  };
}
