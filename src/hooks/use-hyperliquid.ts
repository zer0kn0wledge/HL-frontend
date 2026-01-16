"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  getOrderbook,
  getAllMids,
  getMetaAndAssetCtxs,
  getClearinghouseState,
  getOpenOrders,
  getUserFills,
  createExchangeClient,
  placeOrder,
  cancelOrder,
  updateLeverage,
  approveBuilderFee,
  checkBuilderApproval,
  subscribeToOrderbook,
  subscribeToAllMids,
  subscribeToUserFills,
  subscribeToOrderUpdates,
  closeWebSocket,
} from "@/lib/hyperliquid";
import { useTradingStore } from "@/store/trading-store";
import type { PlaceOrderParams } from "@/lib/hyperliquid";

// Hook for market metadata and asset contexts
export function useMarketMeta() {
  return useQuery({
    queryKey: ["marketMeta"],
    queryFn: getMetaAndAssetCtxs,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook for orderbook data
export function useOrderbook(coin: string) {
  const setOrderbook = useTradingStore((s) => s.setOrderbook);

  const query = useQuery({
    queryKey: ["orderbook", coin],
    queryFn: () => getOrderbook(coin),
    refetchInterval: 2000,
    enabled: !!coin,
  });

  useEffect(() => {
    if (query.data) {
      setOrderbook({
        coin,
        levels: query.data.levels,
        time: Date.now(),
      });
    }
  }, [query.data, coin, setOrderbook]);

  return query;
}

// Hook for mid prices
export function useMidPrices() {
  const setMidPrices = useTradingStore((s) => s.setMidPrices);

  const query = useQuery({
    queryKey: ["midPrices"],
    queryFn: getAllMids,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (query.data) {
      setMidPrices(query.data);
    }
  }, [query.data, setMidPrices]);

  return query;
}

// Hook for account state (positions, margin, etc.)
export function useAccountState() {
  const { address, isConnected } = useAccount();
  const setAccountState = useTradingStore((s) => s.setAccountState);

  const query = useQuery({
    queryKey: ["accountState", address],
    queryFn: () => getClearinghouseState(address!),
    enabled: isConnected && !!address,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (query.data) {
      setAccountState(query.data as any);
    }
  }, [query.data, setAccountState]);

  return query;
}

// Hook for open orders
export function useOpenOrders() {
  const { address, isConnected } = useAccount();
  const setOpenOrders = useTradingStore((s) => s.setOpenOrders);

  const query = useQuery({
    queryKey: ["openOrders", address],
    queryFn: () => getOpenOrders(address!),
    enabled: isConnected && !!address,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (query.data) {
      setOpenOrders(query.data as any);
    }
  }, [query.data, setOpenOrders]);

  return query;
}

// Hook for user fills/trade history
export function useUserFills() {
  const { address, isConnected } = useAccount();
  const setFills = useTradingStore((s) => s.setFills);

  const query = useQuery({
    queryKey: ["userFills", address],
    queryFn: () => getUserFills(address!),
    enabled: isConnected && !!address,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (query.data) {
      setFills(query.data as any);
    }
  }, [query.data, setFills]);

  return query;
}

// Hook for builder fee approval check
export function useBuilderApproval() {
  const { address, isConnected } = useAccount();
  const setBuilderApproved = useTradingStore((s) => s.setBuilderApproved);

  const query = useQuery({
    queryKey: ["builderApproval", address],
    queryFn: () => checkBuilderApproval(address!),
    enabled: isConnected && !!address,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      setBuilderApproved(query.data);
    }
  }, [query.data, setBuilderApproved]);

  return query;
}

// Hook for placing orders
export function usePlaceOrder() {
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (params: Omit<PlaceOrderParams, "exchangeClient">) => {
      if (!walletClient) throw new Error("Wallet not connected");
      const exchangeClient = createExchangeClient(walletClient);
      return placeOrder({ ...params, exchangeClient });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["openOrders", address] });
      queryClient.invalidateQueries({ queryKey: ["accountState", address] });
    },
  });
}

// Hook for canceling orders
export function useCancelOrder() {
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({ assetIndex, orderId }: { assetIndex: number; orderId: number }) => {
      if (!walletClient) throw new Error("Wallet not connected");
      const exchangeClient = createExchangeClient(walletClient);
      return cancelOrder(exchangeClient, assetIndex, orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openOrders", address] });
    },
  });
}

// Hook for updating leverage
export function useUpdateLeverage() {
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({
      assetIndex,
      leverage,
      isCross = true,
    }: {
      assetIndex: number;
      leverage: number;
      isCross?: boolean;
    }) => {
      if (!walletClient) throw new Error("Wallet not connected");
      const exchangeClient = createExchangeClient(walletClient);
      return updateLeverage(exchangeClient, assetIndex, leverage, isCross);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountState", address] });
    },
  });
}

// Hook for approving builder fee
export function useApproveBuilderFee() {
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const setBuilderApproved = useTradingStore((s) => s.setBuilderApproved);
  const setShowBuilderApprovalModal = useTradingStore((s) => s.setShowBuilderApprovalModal);

  return useMutation({
    mutationFn: async () => {
      if (!walletClient) throw new Error("Wallet not connected");
      const exchangeClient = createExchangeClient(walletClient);
      return approveBuilderFee(exchangeClient);
    },
    onSuccess: () => {
      setBuilderApproved(true);
      setShowBuilderApprovalModal(false);
      queryClient.invalidateQueries({ queryKey: ["builderApproval", address] });
    },
  });
}

// Hook for WebSocket subscriptions
export function useWebSocketSubscriptions() {
  const { address, isConnected } = useAccount();
  const selectedCoin = useTradingStore((s) => s.selectedCoin);
  const setOrderbook = useTradingStore((s) => s.setOrderbook);
  const setMidPrices = useTradingStore((s) => s.setMidPrices);
  const addFill = useTradingStore((s) => s.addFill);

  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([]);

  const cleanup = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];
  }, []);

  useEffect(() => {
    cleanup();

    const setupSubscriptions = async () => {
      try {
        // Subscribe to orderbook
        const orderbookSub = await subscribeToOrderbook(selectedCoin, (data) => {
          setOrderbook({
            coin: data.coin,
            levels: data.levels,
            time: data.time,
          });
        });
        subscriptionsRef.current.push(orderbookSub);

        // Subscribe to all mid prices
        const midsSub = await subscribeToAllMids((data) => {
          setMidPrices(data.mids);
        });
        subscriptionsRef.current.push(midsSub);

        // Subscribe to user fills if connected
        if (isConnected && address) {
          const fillsSub = await subscribeToUserFills(address, (data) => {
            if (data.fills && data.fills.length > 0) {
              data.fills.forEach((fill) => addFill(fill as any));
            }
          });
          subscriptionsRef.current.push(fillsSub);

          const ordersSub = await subscribeToOrderUpdates(address, () => {
            // Order updates trigger a refresh via query invalidation
          });
          subscriptionsRef.current.push(ordersSub);
        }
      } catch (error) {
        console.error("Error setting up WebSocket subscriptions:", error);
      }
    };

    setupSubscriptions();

    return () => {
      cleanup();
    };
  }, [selectedCoin, isConnected, address, setOrderbook, setMidPrices, addFill, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeWebSocket();
    };
  }, []);
}
