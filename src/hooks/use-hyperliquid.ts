"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import {
  createExchangeClient,
  placeOrder,
  cancelOrder,
  updateLeverage,
  approveBuilderFee,
} from "@/lib/hyperliquid";
import { useAppStore } from "@/store";
import type { PlaceOrderParams } from "@/lib/hyperliquid";

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
  const { setBuilderApproved, setShowBuilderApprovalModal } = useAppStore();

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
