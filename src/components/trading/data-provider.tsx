"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import {
  useMidPrices,
  useOrderbook,
  useAccountState,
  useOpenOrders,
  useUserFills,
  useBuilderApproval,
  useWebSocketSubscriptions,
} from "@/hooks/use-hyperliquid";
import { useTradingStore } from "@/store/trading-store";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const selectedCoin = useTradingStore((s) => s.selectedCoin);
  const reset = useTradingStore((s) => s.reset);

  // Fetch market data
  useMidPrices();
  useOrderbook(selectedCoin);

  // Fetch user data when connected
  useAccountState();
  useOpenOrders();
  useUserFills();
  useBuilderApproval();

  // Set up WebSocket subscriptions
  useWebSocketSubscriptions();

  // Reset store on disconnect
  useEffect(() => {
    if (!isConnected) {
      // Keep market data but reset user-specific data
      useTradingStore.setState({
        accountState: null,
        positions: [],
        openOrders: [],
        fills: [],
        isBuilderApproved: false,
      });
    }
  }, [isConnected]);

  return <>{children}</>;
}
