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

  // Get wallet client for signing orders
  const { data: walletClient } = useWalletClient();

  // Get REAL balance from Hyperliquid account
  const { accountState } = useUserStore();
  const realBalance = useMemo(() => {
    const withdrawable = accountState?.marginSummary?.withdrawable || '0';
    return new BigNumber(withdrawable).toNumber();
  }, [accountState]);

  // Calculate total staked in active bets
  const totalStaked = useMemo(() => {
    return state.activeBets.reduce((sum, bet) => sum + bet.stake, 0);
  }, [state.activeBets]);

  // Available balance - USE REAL HL BALANCE in real mode
  const availableBalance = isDemoMode
    ? demoBalance - totalStaked
    : realBalance - totalStaked;

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

  // Sync balance to state
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

    // Only update demo balance manually (real balance updates from HL)
    if (isDemoMode) {
      const winnings = bet.stake * bet.multiplier;
      const profit = winnings - bet.stake;
      setDemoBalance(prev => prev + profit);
    }
  }, [triggerHaptic, isDemoMode]);

  // Handle bet loss
  const handleBetLost = useCallback((bet: TapBet) => {
    dispatch({ type: 'BET_LOST', payload: bet.id });
    triggerHaptic('error');

    // Only update demo balance manually (real balance updates from HL)
    if (isDemoMode) {
      setDemoBalance(prev => prev - bet.stake);
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

  // Place a bet - DEMO mode simulates, REAL mode places actual HL orders
  const placeBet = useCallback(async (box: GridBox): Promise<boolean> => {
    console.log('placeBet called:', { box, isDemoMode, availableBalance, betAmount: state.betAmount, realBalance });

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

    // DEMO MODE - Instant simulated placement
    if (isDemoMode) {
      console.log('Demo mode - placing simulated bet:', bet);
      dispatch({ type: 'PLACE_BET', payload: bet });
      playSound('tap');
      triggerHaptic('medium');
      return true;
    }

    // REAL MODE - Place actual order on Hyperliquid
    if (!walletClient) {
      console.error('Wallet not connected');
      triggerHaptic('error');
      return false;
    }

    if (assetIndex < 0) {
      console.error('Invalid asset index for', state.asset);
      triggerHaptic('error');
      return false;
    }

    setIsPlacingOrder(true);

    try {
      // Calculate position size based on bet amount and leverage
      const leverage = 5; // 5x leverage for tap trading
      const positionSize = (state.betAmount * leverage) / currentPrice;
      const sizeStr = positionSize.toFixed(6);

      console.log(`Placing REAL ${box.direction} order: ${sizeStr} ${state.asset} @ market`);

      const exchangeClient = createExchangeClient(walletClient);

      // Place market order on Hyperliquid
      const result = await placeOrder({
        exchangeClient,
        assetIndex,
        isBuy: box.direction === 'long',
        price: currentPrice.toString(),
        size: sizeStr,
        reduceOnly: false,
        orderType: 'market',
      });

      console.log('Order placed successfully:', result);

      // Track the bet
      dispatch({ type: 'PLACE_BET', payload: bet });
      playSound('tap');
      triggerHaptic('medium');

      return true;
    } catch (error) {
      console.error('Failed to place order:', error);
      triggerHaptic('error');
      playSound('lose');
      return false;
    } finally {
      setIsPlacingOrder(false);
    }
  }, [availableBalance, state.betAmount, state.asset, currentPrice, triggerHaptic, walletClient, assetIndex, isPlacingOrder, isDemoMode, realBalance]);

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

    // Real balance from Hyperliquid
    realBalance,

    // Actions
    placeBet,
    setBetAmount,
    setAsset,
    clearLastWin,
    toggleDemoMode,
    resetDemoBalance,
  };
}
