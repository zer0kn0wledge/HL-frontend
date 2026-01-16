"use client";

import { useAccount } from "wagmi";
import { useHypurrNFTOwnership } from "./use-hypurr-nft";
import { FEE_TIERS, VOLUME_THRESHOLDS, type FeeTier } from "@/lib/fees/constants";
import { useUserStore } from "@/store";
import BigNumber from "bignumber.js";

// ============================================
// User Tier Result
// ============================================

export interface UserTierResult {
  tier: FeeTier;
  tierConfig: (typeof FEE_TIERS)[FeeTier];
  reason: "default" | "volume" | "hypurr_nft";
  perpsFee: number;
  spotFee: number;
  nextTier?: {
    tier: FeeTier;
    requirement: string;
    progress?: number;
  };
  isLoading: boolean;
}

// ============================================
// Monthly Volume Hook (from user store)
// ============================================

function useMonthlyVolume(): { volume: number; isLoading: boolean } {
  // In production, this would fetch from backend or calculate from fills
  // For now, we'll use a placeholder that could be populated from the user store
  const { fills } = useUserStore();

  // Calculate 30-day volume from fills (simplified)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const monthlyFills = fills.filter((f) => f.time >= thirtyDaysAgo);

  const volume = monthlyFills.reduce((sum, fill) => {
    const tradeValue = new BigNumber(fill.px).times(fill.sz);
    return sum.plus(tradeValue);
  }, new BigNumber(0));

  return {
    volume: volume.toNumber(),
    isLoading: false,
  };
}

// ============================================
// User Tier Hook
// ============================================

export function useUserTier(): UserTierResult {
  const { address } = useAccount();
  const { hasNFT, loading: nftLoading } = useHypurrNFTOwnership(address);
  const { volume: monthlyVolume, isLoading: volumeLoading } = useMonthlyVolume();

  const isLoading = nftLoading || volumeLoading;

  // VIP: HypurrNFT holder (automatic, no volume requirement)
  if (hasNFT) {
    return {
      tier: "VIP",
      tierConfig: FEE_TIERS.VIP,
      reason: "hypurr_nft",
      perpsFee: FEE_TIERS.VIP.perpsFee,
      spotFee: FEE_TIERS.VIP.spotFee,
      isLoading,
    };
  }

  // VIP: $10M+ monthly volume
  if (monthlyVolume >= VOLUME_THRESHOLDS.VIP) {
    return {
      tier: "VIP",
      tierConfig: FEE_TIERS.VIP,
      reason: "volume",
      perpsFee: FEE_TIERS.VIP.perpsFee,
      spotFee: FEE_TIERS.VIP.spotFee,
      isLoading,
    };
  }

  // PRO: $1M+ monthly volume
  if (monthlyVolume >= VOLUME_THRESHOLDS.PRO) {
    return {
      tier: "PRO",
      tierConfig: FEE_TIERS.PRO,
      reason: "volume",
      perpsFee: FEE_TIERS.PRO.perpsFee,
      spotFee: FEE_TIERS.PRO.spotFee,
      nextTier: {
        tier: "VIP",
        requirement: "$10M monthly volume or own a HypurrNFT",
        progress: monthlyVolume / VOLUME_THRESHOLDS.VIP,
      },
      isLoading,
    };
  }

  // STANDARD: Default
  return {
    tier: "STANDARD",
    tierConfig: FEE_TIERS.STANDARD,
    reason: "default",
    perpsFee: FEE_TIERS.STANDARD.perpsFee,
    spotFee: FEE_TIERS.STANDARD.spotFee,
    nextTier: {
      tier: "PRO",
      requirement: "$1M monthly volume",
      progress: monthlyVolume / VOLUME_THRESHOLDS.PRO,
    },
    isLoading,
  };
}

// ============================================
// Fee Rate Formatter
// ============================================

export function formatFeeRate(feeInBps: number): string {
  return `${(feeInBps / 10000).toFixed(3)}%`;
}

export function formatFeeRateBps(feeInBps: number): string {
  return `${(feeInBps / 10).toFixed(1)} bps`;
}
