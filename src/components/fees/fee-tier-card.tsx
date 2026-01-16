"use client";

import { Crown, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserTier, formatFeeRate } from "@/hooks/use-user-tier";
import { useHypurrNFTOwnership } from "@/hooks/use-hypurr-nft";
import { useAccount } from "wagmi";
import { FEE_TIERS, FEE_VALUE_PROP } from "@/lib/fees/constants";
import { HYPURR_OPENSEA_URL } from "@/lib/nft/hypurr";
import { Button } from "@/components/ui/button";

// ============================================
// Fee Tier Badge
// ============================================

interface FeeTierBadgeProps {
  tier: keyof typeof FEE_TIERS;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function FeeTierBadge({ tier, size = "md", showIcon = true }: FeeTierBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const tierColors = {
    STANDARD: "bg-muted text-muted-foreground",
    PRO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    VIP: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium border",
        sizeClasses[size],
        tierColors[tier]
      )}
    >
      {showIcon && tier === "VIP" && <Crown className="h-3 w-3" />}
      {tier}
    </span>
  );
}

// ============================================
// VIP Status Display
// ============================================

export function VIPStatus() {
  const { address } = useAccount();
  const { hasNFT, loading } = useHypurrNFTOwnership(address);
  const { tier, reason } = useUserTier();

  if (loading) {
    return <div className="h-6 w-24 bg-muted animate-pulse rounded" />;
  }

  if (tier !== "VIP") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <FeeTierBadge tier={tier} size="sm" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <FeeTierBadge tier="VIP" size="sm" />
      {reason === "hypurr_nft" && (
        <img
          src="/hypurr-badge.png"
          alt="Hypurr"
          className="h-5 w-5"
          title="HypurrNFT holder"
        />
      )}
    </div>
  );
}

// ============================================
// Fee Tier Card
// ============================================

export function FeeTierCard() {
  const { address } = useAccount();
  const { tier, reason, perpsFee, spotFee, nextTier, isLoading } = useUserTier();
  const { hasNFT } = useHypurrNFTOwnership(address);

  if (isLoading) {
    return (
      <div className="p-4 bg-card rounded-lg border border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            {FEE_TIERS[tier].name} Tier
            {tier === "VIP" && <Crown className="h-4 w-4 text-yellow-500" />}
          </h3>
          <p className="text-sm text-muted-foreground">
            {reason === "hypurr_nft"
              ? "HypurrNFT Holder"
              : reason === "volume"
              ? "Volume-based"
              : "Default tier"}
          </p>
        </div>
        <FeeTierBadge tier={tier} />
      </div>

      {/* Fee rates */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Perps Fee</p>
          <p className="text-lg font-mono font-semibold">{formatFeeRate(perpsFee)}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Spot Fee</p>
          <p className="text-lg font-mono font-semibold">{formatFeeRate(spotFee)}</p>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Upgrade to {nextTier.tier}
            </p>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {nextTier.requirement}
          </p>
          {nextTier.progress !== undefined && (
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(nextTier.progress * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* VIP promotion for non-VIP users */}
      {!hasNFT && tier !== "VIP" && (
        <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <p className="text-sm text-purple-300 mb-2">
            💎 Own a HypurrNFT for instant VIP status
          </p>
          <a
            href={HYPURR_OPENSEA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline"
          >
            View collection on OpenSea
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Value prop */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-center text-muted-foreground">
          {FEE_VALUE_PROP.headline}
        </p>
      </div>
    </div>
  );
}

// ============================================
// Fee Comparison Table
// ============================================

export function FeeComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium">Platform</th>
            <th className="text-right py-2 px-3 font-medium">Taker Fee</th>
            <th className="text-right py-2 px-3 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/50">
            <td className="py-2 px-3 text-muted-foreground">Hyperliquid (Native)</td>
            <td className="py-2 px-3 text-right font-mono">0.045%</td>
            <td className="py-2 px-3 text-right text-muted-foreground">Base rate</td>
          </tr>
          <tr className="border-b border-border/50 bg-muted/30">
            <td className="py-2 px-3">
              <span className="font-medium">HyperTerminal</span>
              <FeeTierBadge tier="STANDARD" size="sm" />
            </td>
            <td className="py-2 px-3 text-right font-mono">0.075%</td>
            <td className="py-2 px-3 text-right text-muted-foreground">+3 bps builder</td>
          </tr>
          <tr className="border-b border-border/50 bg-blue-500/5">
            <td className="py-2 px-3">
              <span className="font-medium">HyperTerminal</span>
              <FeeTierBadge tier="PRO" size="sm" />
            </td>
            <td className="py-2 px-3 text-right font-mono">0.065%</td>
            <td className="py-2 px-3 text-right text-muted-foreground">+2 bps builder</td>
          </tr>
          <tr className="border-b border-border/50 bg-purple-500/5">
            <td className="py-2 px-3">
              <span className="font-medium">HyperTerminal</span>
              <FeeTierBadge tier="VIP" size="sm" />
            </td>
            <td className="py-2 px-3 text-right font-mono">0.055%</td>
            <td className="py-2 px-3 text-right text-muted-foreground">+1 bp builder</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
