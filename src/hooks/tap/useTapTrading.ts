'use client';

import { useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import { TapTradingState, TapTradingAction, TapBet, GridBox } from '@/lib/tap/types';
import { DEFAULT_BET_AMOUNT } from '@/lib/tap/constants';
import { generateGridBoxes } from '@/lib/tap/multiplierCalculator';
import { usePriceStream } from './usePriceStream';
import { useBetMonitor } from './useBetMonitor';
import { useHaptics } from './useHaptics';
import { playSound } from '@/lib/tap/sounds';
import { useUserStore } from '@/store';
import { placeOrder, createExchangeClient } from '@/lib/hyperliquid';
import { PERP_ASSET_INDEXES } from '@/lib/constants';
import { useWalletClient } from 'wagmi';
import BigNumber from 'bignumber.js';

// Demo mode starting balance
const DEMO_STARTING_BALANCE = 1000;

// Local storage key for tap trading balance
const TAP_BALANCE_KEY = 'tap-trading-balance';

const initialState: TapTradingState = {
  asset: 'BTC',
  currentPrice: 0,
  priceHistory: [],
  betAmount: DEFAULT_BET_AMOUNT,
  activeBets: [],
  completedBets: [],
  balance: 0,
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
      };

    case 'BET_WON': {
      const bet = state.activeBets.find(b => b.id === action.payload.id);
      if (!bet) return state;

      const winnings = bet.stake * bet.multiplier;
      return {
        ...state,
        activeBets: state.activeBets.filter(b => b.id !== action.payload.id),
        completedBets: [...state.completedBets, { ...bet, status: 'won', pnl: winnings - bet.stake }],
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
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Demo mode - starts OFF by default (REAL mode is default)
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoBalance, setDemoBalance] = useState(DEMO_STARTING_BALANCE);

  // Tap trading balance for real mode (pre-approved funds)
  const [tapTradingBalance, setTapTradingBalance] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TAP_BALANCE_KEY);
      return stored ? parseFloat(stored) : 0;
    }
    return 0;
  });

  // Persist tap trading balance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TAP_BALANCE_KEY, tapTradingBalance.toString());
    }
  }, [tapTradingBalance]);

  // Get wallet client for signing orders (real mode only)
  const { data: walletClient } = useWalletClient();

  // Get real balance from user store
  const { accountState } = useUserStore();
  const realBalance = useMemo(() => {
    const withdrawable = accountState?.marginSummary?.withdrawable || '0';
    return new BigNumber(withdrawable).toNumber();
  }, [accountState]);

  // Calculate total staked in active bets
  const totalStaked = useMemo(() => {
    return state.activeBets.reduce((sum, bet) => sum + bet.stake, 0);
  }, [state.activeBets]);

  // Available balance depends on mode
  // In real mode, use the tap trading balance (pre-approved funds)
  const availableBalance = isDemoMode
    ? demoBalance - totalStaked
    : tapTradingBalance - totalStaked;

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

  // Sync balance to state based on mode
  useEffect(() => {
    const balance = isDemoMode ? demoBalance : realBalance;
    if (balance !== state.balance) {
      dispatch({ type: 'SET_BALANCE', payload: balance });
    }
  }, [realBalance, demoBalance, isDemoMode, state.balance]);

  // Generate grid boxes
  const gridBoxes = useMemo(() => {
    if (!currentPrice) return { longBoxes: [], shortBoxes: [] };
    return generateGridBoxes(currentPrice, state.asset);
  }, [currentPrice, state.asset]);

  // Handle bet win
  const handleBetWon = useCallback((bet: TapBet) => {
    dispatch({ type: 'BET_WON', payload: { id: bet.id, pnl: bet.stake * bet.multiplier } });
    triggerHaptic('success');
    playSound('win');
    setLastWin(bet);

    const winnings = bet.stake * bet.multiplier;
    const profit = winnings - bet.stake;

    // Update balance based on mode
    if (isDemoMode) {
      setDemoBalance(prev => prev + profit);
    } else {
      setTapTradingBalance(prev => prev + profit);
    }
  }, [triggerHaptic, isDemoMode]);

  // Handle bet loss
  const handleBetLost = useCallback((bet: TapBet) => {
    dispatch({ type: 'BET_LOST', payload: bet.id });
    triggerHaptic('error');

    // Update balance based on mode
    if (isDemoMode) {
      setDemoBalance(prev => prev - bet.stake);
    } else {
      setTapTradingBalance(prev => prev - bet.stake);
    }
  }, [triggerHaptic, isDemoMode]);

  // Clear last win
  const clearLastWin = useCallback(() => {
    setLastWin(null);
  }, []);

  // Monitor bets for wins/losses
  useBetMonitor({
    bets: state.activeBets,
    currentPrice,
    onBetWon: handleBetWon,
    onBetLost: handleBetLost,
  });

  // Get asset index for perp trading
  const assetIndex = useMemo(() => {
    return PERP_ASSET_INDEXES[state.asset] ?? -1;
  }, [state.asset]);

  // Place a bet - Both modes now use instant placement with pre-approved funds
  // DEMO: Uses demo balance
  // REAL: Uses tap trading balance (pre-deposited funds)
  const placeBet = useCallback(async (box: GridBox): Promise<boolean> => {
    console.log('placeBet called:', { box, isDemoMode, availableBalance, betAmount: state.betAmount });

    // Check if user has enough available balance
    if (availableBalance < state.betAmount) {
      console.log('Insufficient balance:', availableBalance, '<', state.betAmount);
      triggerHaptic('error');
      playSound('lose');
      return false;
    }

    // Prevent double-placing
    if (isPlacingOrder) {
      console.log('Already placing order');
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

    // Both DEMO and REAL modes now use instant placement
    // Real mode uses pre-deposited tap trading balance
    // (Future: integrate with Hyperliquid session keys for actual order execution)
    console.log(`${isDemoMode ? 'Demo' : 'Real'} mode - placing bet:`, bet);
    dispatch({ type: 'PLACE_BET', payload: bet });
    playSound('tap');
    triggerHaptic('medium');
    return true;
  }, [availableBalance, state.betAmount, state.asset, currentPrice, triggerHaptic, isPlacingOrder, isDemoMode]);

  // Set bet amount
  const setBetAmount = useCallback((amount: number) => {
    dispatch({ type: 'SET_BET_AMOUNT', payload: amount });
  }, []);

  // Set asset
  const setAsset = useCallback((asset: string) => {
    dispatch({ type: 'SET_ASSET', payload: asset });
  }, []);

  // Toggle demo mode
  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
  }, []);

  // Reset demo balance
  const resetDemoBalance = useCallback(() => {
    setDemoBalance(DEMO_STARTING_BALANCE);
  }, []);

  // Deposit to tap trading balance (for real mode)
  const depositTapBalance = useCallback((amount: number) => {
    setTapTradingBalance(prev => prev + amount);
  }, []);

  // Withdraw from tap trading balance
  const withdrawTapBalance = useCallback((amount: number) => {
    setTapTradingBalance(prev => Math.max(0, prev - amount));
  }, []);

  return {
    // State
    asset: state.asset,
    currentPrice,
    priceHistory,
    betAmount: state.betAmount,
    activeBets: state.activeBets,
    completedBets: state.completedBets,
    balance: availableBalance,
    sessionPnL: state.sessionPnL,
    isConnected,
    gridBoxes,
    lastWin,
    isPlacingOrder,

    // Demo mode
    isDemoMode,
    demoBalance,

    // Tap trading balance (for real mode)
    tapTradingBalance,
    realBalance,

    // Actions
    placeBet,
    setBetAmount,
    setAsset,
    clearLastWin,
    toggleDemoMode,
    resetDemoBalance,
    depositTapBalance,
    withdrawTapBalance,
  };
}
