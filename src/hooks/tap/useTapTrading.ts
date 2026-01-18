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
        // Don't deduct from balance here - we'll track it separately
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

  // Get wallet client for signing orders
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

  // Available balance = real balance - total staked
  const availableBalance = realBalance - totalStaked;

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

  // Sync real balance to state
  useEffect(() => {
    if (realBalance !== state.balance) {
      dispatch({ type: 'SET_BALANCE', payload: realBalance });
    }
  }, [realBalance, state.balance]);

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

  // Get asset index for perp trading
  const assetIndex = useMemo(() => {
    return PERP_ASSET_INDEXES[state.asset] ?? -1;
  }, [state.asset]);

  // Place a bet - places actual perp order
  const placeBet = useCallback(async (box: GridBox): Promise<boolean> => {
    // Check if user has enough available balance
    if (availableBalance < state.betAmount) {
      triggerHaptic('error');
      return false;
    }

    // Check if wallet is connected
    if (!walletClient) {
      console.error('Wallet not connected');
      triggerHaptic('error');
      return false;
    }

    // Check if we have a valid asset index
    if (assetIndex < 0) {
      console.error('Invalid asset index for', state.asset);
      triggerHaptic('error');
      return false;
    }

    // Prevent double-placing
    if (isPlacingOrder) return false;
    setIsPlacingOrder(true);

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

    try {
      // Calculate position size: stake / current price * leverage (use 5x default)
      const leverage = 5;
      const positionSize = (state.betAmount * leverage) / currentPrice;
      const sizeStr = positionSize.toFixed(6);

      // Create exchange client and place market order
      const exchangeClient = createExchangeClient(walletClient);

      // Place a market order in the direction of the bet
      await placeOrder({
        exchangeClient,
        assetIndex,
        isBuy: box.direction === 'long',
        price: currentPrice.toString(), // Will fill at market price
        size: sizeStr,
        reduceOnly: false,
        orderType: 'market',
      });

      // Add bet to state after successful order
      dispatch({ type: 'PLACE_BET', payload: bet });
      playSound('tap');
      triggerHaptic('medium');

      console.log(`Placed ${box.direction} order: ${sizeStr} ${state.asset} @ market`);
      return true;
    } catch (error) {
      console.error('Failed to place order:', error);
      triggerHaptic('error');
      return false;
    } finally {
      setIsPlacingOrder(false);
    }
  }, [availableBalance, state.betAmount, state.asset, currentPrice, triggerHaptic, walletClient, assetIndex, isPlacingOrder]);

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
    balance: availableBalance, // Use available balance (real - staked)
    sessionPnL: state.sessionPnL,
    isConnected,
    gridBoxes,
    lastWin,
    isPlacingOrder,

    // Actions
    placeBet,
    setBetAmount,
    setAsset,
    clearLastWin,
  };
}
