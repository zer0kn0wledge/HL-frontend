// ============================================
// Fee Tier Constants
// ============================================

import type { BuilderConfig } from "@/types";

export const FEE_TIERS = {
  STANDARD: {
    id: "standard",
    name: "Standard",
    perpsFee: 30, // 3 bps (0.03%) - in 1/10000 bps
    spotFee: 50, // 5 bps (0.05%)
    requirements: null, // Default tier
  },
  PRO: {
    id: "pro",
    name: "Pro",
    perpsFee: 20, // 2 bps (0.02%)
    spotFee: 40, // 4 bps (0.04%)
    requirements: {
      monthlyVolume: 1_000_000, // $1M monthly volume
    },
  },
  VIP: {
    id: "vip",
    name: "VIP",
    perpsFee: 10, // 1 bp (0.01%)
    spotFee: 20, // 2 bps (0.02%)
    requirements: {
      monthlyVolume: 10_000_000, // $10M monthly volume
      // OR
      hypurrNftHolder: true, // Owns HypurrNFT
    },
  },
} as const;

export type FeeTier = keyof typeof FEE_TIERS;
export type FeeTierConfig = (typeof FEE_TIERS)[FeeTier];

// Fee comparison for UI display
export const FEE_COMPARISON = {
  nativeHyperliquid: {
    taker: "0.045%", // 4.5 bps
    maker: "0.010%", // 1 bp
  },
  hyperTerminal: {
    standard: {
      total: "0.075%", // 4.5 + 3 = 7.5 bps taker
      builder: "0.03%",
    },
    pro: {
      total: "0.065%", // 4.5 + 2 = 6.5 bps taker
      builder: "0.02%",
    },
    vip: {
      total: "0.055%", // 4.5 + 1 = 5.5 bps taker
      builder: "0.01%",
    },
  },
  lighter: {
    taker: "0.00%",
    maker: "0.00%",
    note: "Subsidized by VC funding",
  },
};

// Marketing messaging
export const FEE_VALUE_PROP = {
  headline: "100% of HyperTerminal fees buy HYPE",
  subheadline: "Trade on the best frontend. Support the ecosystem.",
  vipMessage: "HypurrNFT holders get VIP status automatically",
};

// Volume thresholds for tier progression
export const VOLUME_THRESHOLDS = {
  PRO: 1_000_000, // $1M
  VIP: 10_000_000, // $10M
} as const;

// Builder config by tier
export function getBuilderConfigForTier(tier: FeeTier): BuilderConfig {
  const tierConfig = FEE_TIERS[tier];
  return {
    address: "0x0000000000000000000000000000000000000000" as const,
    name: "HyperTerminal",
    feeRate: tierConfig.perpsFee,
    maxFeeRate: `${(tierConfig.perpsFee / 10000).toFixed(3)}%`,
  };
}
