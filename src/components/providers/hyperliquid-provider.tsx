"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAccount, useWalletClient } from "wagmi";
import * as hl from "@nktkas/hyperliquid";
import {
  createExchangeClient,
  getSubscriptionClient,
  closeWebSocket,
  subscribeToOrderbook,
  subscribeToAllMids,
  subscribeToUserFills,
  subscribeToOrderUpdates,
  subscribeToTrades,
  fetchPerpMarkets,
  fetchSpotMarkets,
  fetchHip3Markets,
  fetchMarketStats,
  getClearinghouseState,
  getOpenOrders,
  getUserFills,
  checkBuilderApproval,
} from "@/lib/hyperliquid";
import { useAppStore, useMarketStore, useUserStore } from "@/store";
import type { Orderbook, RecentTrade, Fill, OpenOrder } from "@/types";

// ============================================
// Context
// ============================================

interface HyperliquidContextValue {
  exchangeClient: hl.ExchangeClient | null;
  isReady: boolean;
  refreshAccountData: () => Promise<void>;
  refreshMarketData: () => Promise<void>;
}

const HyperliquidContext = createContext<HyperliquidContextValue>({
  exchangeClient: null,
  isReady: false,
  refreshAccountData: async () => {},
  refreshMarketData: async () => {},
});

export const useHyperliquid = () => useContext(HyperliquidContext);

// ============================================
// Provider
// ============================================

export function HyperliquidProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Store actions
  const {
    setConnected,
    setWsConnected,
    setInitializing,
    setBuilderApproved,
    setCurrentMarket,
  } = useAppStore();

  const { currentCoin, currentMarketType } = useAppStore();

  const {
    setMarkets,
    setMarketStats,
    setOrderbook,
    setRecentTrades,
  } = useMarketStore();

  const {
    setAddress,
    setAccountState,
    setOpenOrders,
    setFills,
    addFill,
  } = useUserStore();

  // Refs
  const exchangeClientRef = useRef<hl.ExchangeClient | null>(null);
  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([]);

  // ============================================
  // Market Data Loading
  // ============================================

  const loadMarketData = useCallback(async () => {
    try {
      const [perpMarkets, spotMarkets, hip3Markets, stats] = await Promise.all([
        fetchPerpMarkets(),
        fetchSpotMarkets(),
        fetchHip3Markets(),
        fetchMarketStats(),
      ]);

      setMarkets("perp", perpMarkets);
      setMarkets("spot", spotMarkets);
      setMarkets("hip3", hip3Markets);
      setMarketStats(stats);
    } catch (error) {
      console.error("Error loading market data:", error);
    }
  }, [setMarkets, setMarketStats]);

  // ============================================
  // Account Data Loading
  // ============================================

  const loadAccountData = useCallback(async () => {
    if (!address) return;

    try {
      const [clearinghouse, orders, fills] = await Promise.all([
        getClearinghouseState(address),
        getOpenOrders(address),
        getUserFills(address),
      ]);

      setAccountState(clearinghouse as any);
      setOpenOrders(orders as OpenOrder[]);
      setFills(fills as Fill[]);

      // Check builder approval
      const isApproved = await checkBuilderApproval(address);
      setBuilderApproved(isApproved);
    } catch (error) {
      console.error("Error loading account data:", error);
    }
  }, [address, setAccountState, setOpenOrders, setFills, setBuilderApproved]);

  // ============================================
  // WebSocket Subscriptions
  // ============================================

  const setupSubscriptions = useCallback(async () => {
    // Clear existing subscriptions
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];

    try {
      // Subscribe to orderbook for current market
      const orderbookSub = await subscribeToOrderbook(
        currentCoin,
        (data: Orderbook) => {
          setOrderbook(data);
        }
      );
      subscriptionsRef.current.push(orderbookSub);

      // Subscribe to all mid prices
      const midsSub = await subscribeToAllMids((mids) => {
        const stats = useMarketStore.getState().marketStats;
        const updatedStats = { ...stats };
        Object.entries(mids).forEach(([coin, midPx]) => {
          if (updatedStats[coin]) {
            updatedStats[coin] = { ...updatedStats[coin], midPx };
          }
        });
        setMarketStats(updatedStats);
      });
      subscriptionsRef.current.push(midsSub);

      // Subscribe to recent trades for current market
      const tradesSub = await subscribeToTrades(
        currentCoin,
        (trades: RecentTrade[]) => {
          trades.forEach((trade) => {
            useMarketStore.getState().addRecentTrade(trade);
          });
        }
      );
      subscriptionsRef.current.push(tradesSub);

      // User-specific subscriptions
      if (address) {
        const fillsSub = await subscribeToUserFills(address, (fills) => {
          fills.forEach((fill) => addFill(fill as Fill));
        });
        subscriptionsRef.current.push(fillsSub);

        const ordersSub = await subscribeToOrderUpdates(address, async () => {
          // Refresh orders on any order update
          const orders = await getOpenOrders(address);
          setOpenOrders(orders as OpenOrder[]);
        });
        subscriptionsRef.current.push(ordersSub);
      }

      setWsConnected(true);
    } catch (error) {
      console.error("Error setting up subscriptions:", error);
      setWsConnected(false);
    }
  }, [currentCoin, address, setOrderbook, setMarketStats, setRecentTrades, addFill, setOpenOrders, setWsConnected]);

  // ============================================
  // Initialize Exchange Client
  // ============================================

  useEffect(() => {
    if (walletClient && isConnected) {
      exchangeClientRef.current = createExchangeClient(walletClient);
    } else {
      exchangeClientRef.current = null;
    }
  }, [walletClient, isConnected]);

  // ============================================
  // Connection State
  // ============================================

  useEffect(() => {
    setConnected(isConnected);
    setAddress(isConnected && address ? address : null);
  }, [isConnected, address, setConnected, setAddress]);

  // ============================================
  // Initial Data Load
  // ============================================

  useEffect(() => {
    const init = async () => {
      setInitializing(true);
      await loadMarketData();
      setInitializing(false);
    };

    init();
  }, [loadMarketData, setInitializing]);

  // ============================================
  // Account Data on Connect
  // ============================================

  useEffect(() => {
    if (isConnected && address) {
      loadAccountData();
    }
  }, [isConnected, address, loadAccountData]);

  // ============================================
  // WebSocket Management
  // ============================================

  useEffect(() => {
    setupSubscriptions();

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [setupSubscriptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeWebSocket();
    };
  }, []);

  // ============================================
  // Refresh Functions
  // ============================================

  const refreshAccountData = useCallback(async () => {
    await loadAccountData();
  }, [loadAccountData]);

  const refreshMarketData = useCallback(async () => {
    await loadMarketData();
  }, [loadMarketData]);

  // ============================================
  // Context Value
  // ============================================

  const value: HyperliquidContextValue = {
    exchangeClient: exchangeClientRef.current,
    isReady: !useAppStore.getState().isInitializing,
    refreshAccountData,
    refreshMarketData,
  };

  return (
    <HyperliquidContext.Provider value={value}>
      {children}
    </HyperliquidContext.Provider>
  );
}
