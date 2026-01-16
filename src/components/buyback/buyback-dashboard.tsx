"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  TrendingUp,
  Users,
  Building2,
  Clock,
  ExternalLink,
  Info,
  ArrowUpRight,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BuybackStats, BuybackRecord, UserReward } from "@/types/social";
import BigNumber from "bignumber.js";

// ============================================
// Mock Data (would come from API)
// ============================================

const MOCK_BUYBACK_STATS: BuybackStats = {
  totalHypeBought: "1250000",
  totalUsdValue: "2500000",
  distributedToUsers: "875000",
  treasuryBalance: "375000",
  averagePrice: "2.00",
  totalBuybacks: 156,
};

const MOCK_RECENT_BUYBACKS: BuybackRecord[] = [
  {
    id: "bb-1",
    timestamp: Date.now() - 3600000,
    usdcSpent: "15000",
    hypeReceived: "7500",
    avgPrice: "2.00",
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
    distribution: {
      toUsers: "5250",
      toTreasury: "2250",
    },
  },
  {
    id: "bb-2",
    timestamp: Date.now() - 7200000,
    usdcSpent: "12000",
    hypeReceived: "6100",
    avgPrice: "1.97",
    txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
    distribution: {
      toUsers: "4270",
      toTreasury: "1830",
    },
  },
  {
    id: "bb-3",
    timestamp: Date.now() - 10800000,
    usdcSpent: "18500",
    hypeReceived: "9000",
    avgPrice: "2.06",
    txHash: "0x567890abcdef1234567890abcdef1234567890ab",
    distribution: {
      toUsers: "6300",
      toTreasury: "2700",
    },
  },
];

const MOCK_USER_REWARDS: UserReward[] = [
  {
    address: "0x1234567890123456789012345678901234567890",
    weekStart: new Date(Date.now() - 86400000),
    volume: "125000",
    volumeShare: 0.05,
    hypeReward: "125.50",
    status: "pending",
  },
  {
    address: "0x1234567890123456789012345678901234567890",
    weekStart: new Date(Date.now() - 172800000),
    volume: "75000",
    volumeShare: 0.03,
    hypeReward: "75.25",
    status: "distributed",
    distributedAt: new Date(Date.now() - 86400000),
  },
  {
    address: "0x1234567890123456789012345678901234567890",
    weekStart: new Date(Date.now() - 259200000),
    volume: "250000",
    volumeShare: 0.10,
    hypeReward: "250.00",
    status: "distributed",
    distributedAt: new Date(Date.now() - 172800000),
  },
];

// ============================================
// Stats Card Component
// ============================================

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatsCard({ title, value, subtitle, icon, highlight }: StatsCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        highlight
          ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "p-2 rounded-lg",
            highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ============================================
// How It Works Section
// ============================================

function HowItWorks() {
  const steps = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Trade on HyperTerminal",
      description: "Every trade generates builder fees (1-3 bps based on tier)",
    },
    {
      icon: <ArrowUpRight className="h-5 w-5" />,
      title: "100% Buys HYPE",
      description: "All collected fees are used to buy HYPE tokens on market",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "70% to Traders",
      description: "70% distributed to traders proportional to their volume",
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "30% to Treasury",
      description: "30% funds development and future growth initiatives",
    },
  ];

  return (
    <div className="p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">How It Works</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center p-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
              {step.icon}
            </div>
            <p className="font-medium text-sm">{step.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Recent Buybacks Table
// ============================================

function RecentBuybacks({ buybacks }: { buybacks: BuybackRecord[] }) {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "< 1h ago";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold">Recent Buybacks</h3>
      </div>
      <ScrollArea className="max-h-[300px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">USDC Spent</th>
              <th className="px-4 py-2 font-medium">HYPE Bought</th>
              <th className="px-4 py-2 font-medium">Price</th>
              <th className="px-4 py-2 font-medium">To Users</th>
              <th className="px-4 py-2 font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {buybacks.map((buyback) => (
              <tr
                key={buyback.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(buyback.timestamp)}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono">
                  ${new BigNumber(buyback.usdcSpent).toFormat(0)}
                </td>
                <td className="px-4 py-3 font-mono text-primary">
                  {new BigNumber(buyback.hypeReceived).toFormat(0)} HYPE
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  ${buyback.avgPrice}
                </td>
                <td className="px-4 py-3 font-mono text-long">
                  {new BigNumber(buyback.distribution.toUsers).toFormat(0)} HYPE
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`https://explorer.hyperliquid.xyz/tx/${buyback.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {truncateHash(buyback.txHash)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

// ============================================
// User Rewards Section
// ============================================

function UserRewards({ rewards }: { rewards: UserReward[] }) {
  const { isConnected } = useAccount();

  const pendingRewards = rewards.filter((r) => r.status === "pending");
  const totalPending = pendingRewards.reduce(
    (sum, r) => sum.plus(r.hypeReward),
    new BigNumber(0)
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (!isConnected) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Connect wallet to view your rewards
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Your Rewards</h3>
        {totalPending.gt(0) && (
          <Button size="sm">
            Claim {totalPending.toFormat(2)} HYPE
          </Button>
        )}
      </div>

      {rewards.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            Trade to earn HYPE rewards!
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[250px]">
          <div className="divide-y divide-border/50">
            {rewards.map((reward, index) => (
              <div
                key={index}
                className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      reward.status === "distributed"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Volume Rebate ({(reward.volumeShare * 100).toFixed(1)}% share)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Week of {formatDate(reward.weekStart)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-mono font-medium",
                      reward.status === "distributed" ? "text-muted-foreground" : "text-primary"
                    )}
                  >
                    {new BigNumber(reward.hypeReward).toFormat(2)} HYPE
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reward.status === "distributed" ? "Distributed" : "Pending"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ============================================
// Main Buyback Dashboard Component
// ============================================

export function BuybackDashboard() {
  // In production, these would come from API/hooks
  const stats = MOCK_BUYBACK_STATS;
  const buybacks = MOCK_RECENT_BUYBACKS;
  const userRewards = MOCK_USER_REWARDS;

  const formatLargeNumber = (value: string) => {
    const num = new BigNumber(value);
    if (num.gte(1_000_000)) {
      return `${num.div(1_000_000).toFormat(2)}M`;
    }
    if (num.gte(1_000)) {
      return `${num.div(1_000).toFormat(1)}K`;
    }
    return num.toFormat(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">HYPE Buyback</h2>
        <p className="text-muted-foreground">
          100% of builder fees buy HYPE tokens — 70% distributed to traders
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total HYPE Bought"
          value={`${formatLargeNumber(stats.totalHypeBought)} HYPE`}
          subtitle={`$${formatLargeNumber(stats.totalUsdValue)} value`}
          icon={<TrendingUp className="h-5 w-5" />}
          highlight
        />
        <StatsCard
          title="Distributed to Users"
          value={`${formatLargeNumber(stats.distributedToUsers)} HYPE`}
          subtitle="70% of all buybacks"
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Treasury"
          value={`${formatLargeNumber(stats.treasuryBalance)} HYPE`}
          subtitle="30% for development"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatsCard
          title="Average Price"
          value={`$${stats.averagePrice}`}
          subtitle={`${stats.totalBuybacks} buybacks total`}
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
      </div>

      {/* How It Works */}
      <HowItWorks />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentBuybacks buybacks={buybacks} />
        <UserRewards rewards={userRewards} />
      </div>
    </div>
  );
}
