"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Crown, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FeeTierBadge } from "@/components/fees/fee-tier-card";
import type {
  LeaderboardType,
  LeaderboardTimeframe,
  LeaderboardEntry,
  LeaderboardResponse,
} from "@/types/social";
import BigNumber from "bignumber.js";

// ============================================
// Mock Data (replace with actual API calls)
// ============================================

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    rankChange: 0,
    user: {
      address: "0x1234567890123456789012345678901234567890",
      username: "whale_trader",
      displayName: "Whale Trader",
      avatar: "/avatars/1.png",
      tier: "VIP",
      badges: [],
    },
    metric: { type: "pnl", value: "1250000", formatted: "+$1.25M" },
    additionalStats: { trades: 523, winRate: 68, avgLeverage: 12 },
  },
  {
    rank: 2,
    previousRank: 3,
    rankChange: 1,
    user: {
      address: "0x2345678901234567890123456789012345678901",
      username: "sniper_pro",
      displayName: "Sniper Pro",
      tier: "PRO",
      badges: [],
    },
    metric: { type: "pnl", value: "890000", formatted: "+$890K" },
    additionalStats: { trades: 312, winRate: 72, avgLeverage: 8 },
  },
  {
    rank: 3,
    previousRank: 2,
    rankChange: -1,
    user: {
      address: "0x3456789012345678901234567890123456789012",
      username: "degen_master",
      displayName: "Degen Master",
      tier: "VIP",
      badges: [],
    },
    metric: { type: "pnl", value: "650000", formatted: "+$650K" },
    additionalStats: { trades: 1024, winRate: 55, avgLeverage: 25 },
  },
];

// Generate more mock entries
for (let i = 4; i <= 100; i++) {
  MOCK_LEADERBOARD.push({
    rank: i,
    previousRank: i + (Math.random() > 0.5 ? 1 : -1),
    rankChange: Math.floor(Math.random() * 5) - 2,
    user: {
      address: `0x${i.toString().padStart(40, "0")}`,
      username: `trader_${i}`,
      displayName: `Trader ${i}`,
      tier: i <= 10 ? "VIP" : i <= 30 ? "PRO" : "STANDARD",
      badges: [],
    },
    metric: {
      type: "pnl",
      value: String(Math.floor(500000 / i)),
      formatted: `+$${(500000 / i / 1000).toFixed(0)}K`,
    },
    additionalStats: {
      trades: Math.floor(Math.random() * 500) + 50,
      winRate: Math.floor(Math.random() * 30) + 45,
      avgLeverage: Math.floor(Math.random() * 20) + 5,
    },
  });
}

// ============================================
// Hook (placeholder - replace with actual API)
// ============================================

function useLeaderboard(type: LeaderboardType, timeframe: LeaderboardTimeframe) {
  // In production, this would fetch from API
  return {
    data: {
      type,
      timeframe,
      entries: MOCK_LEADERBOARD,
      totalParticipants: 5432,
      updatedAt: new Date(),
    } as LeaderboardResponse,
    isLoading: false,
  };
}

// ============================================
// Podium Card
// ============================================

interface PodiumCardProps {
  entry?: LeaderboardEntry;
  position: 1 | 2 | 3;
}

const PODIUM_STYLES = {
  1: {
    height: "h-40",
    gradient: "from-yellow-500 to-amber-600",
    icon: "🥇",
    glow: "shadow-yellow-500/30",
    order: "order-2",
  },
  2: {
    height: "h-32",
    gradient: "from-gray-300 to-gray-400",
    icon: "🥈",
    glow: "shadow-gray-400/30",
    order: "order-1",
  },
  3: {
    height: "h-28",
    gradient: "from-amber-600 to-amber-700",
    icon: "🥉",
    glow: "shadow-amber-500/30",
    order: "order-3",
  },
};

function PodiumCard({ entry, position }: PodiumCardProps) {
  const style = PODIUM_STYLES[position];

  if (!entry) {
    return <div className={cn("bg-muted rounded-lg", style.height, style.order)} />;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg transition-all hover:scale-105 cursor-pointer",
        style.height,
        style.order,
        `shadow-lg ${style.glow}`,
        "bg-card border border-border"
      )}
    >
      {/* Position badge */}
      <div
        className={cn(
          "absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center",
          `bg-gradient-to-br ${style.gradient}`
        )}
      >
        <span className="text-lg">{style.icon}</span>
      </div>

      {/* User info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <div
          className={cn(
            "h-12 w-12 mb-2 rounded-full bg-muted flex items-center justify-center",
            "ring-2 ring-white/20 text-lg font-bold"
          )}
        >
          {entry.user.displayName?.[0] || entry.user.username?.[0] || "?"}
        </div>

        <p className="font-semibold text-sm truncate max-w-full">
          {entry.user.displayName ||
            entry.user.username ||
            `${entry.user.address.slice(0, 6)}...${entry.user.address.slice(-4)}`}
        </p>

        <p
          className={cn(
            "text-lg font-bold font-mono",
            parseFloat(entry.metric.value) >= 0 ? "text-long" : "text-short"
          )}
        >
          {entry.metric.formatted}
        </p>

        {entry.user.tier === "VIP" && (
          <FeeTierBadge tier="VIP" size="sm" />
        )}
      </div>
    </div>
  );
}

// ============================================
// Rank Change Indicator
// ============================================

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-long text-xs">
        <TrendingUp className="h-3 w-3" />
        {change}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-short text-xs">
      <TrendingDown className="h-3 w-3" />
      {Math.abs(change)}
    </span>
  );
}

// ============================================
// Leaderboard Row
// ============================================

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  highlight?: boolean;
}

function LeaderboardRow({ entry, highlight }: LeaderboardRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border/50 hover:bg-muted/30 transition-colors",
        highlight && "bg-primary/10"
      )}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm w-6">{entry.rank}</span>
          <RankChangeIndicator change={entry.rankChange} />
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {entry.user.displayName?.[0] || entry.user.username?.[0] || "?"}
          </div>
          <div>
            <p className="font-medium text-sm">
              {entry.user.displayName ||
                entry.user.username ||
                `${entry.user.address.slice(0, 6)}...`}
            </p>
            {entry.user.username && (
              <p className="text-xs text-muted-foreground">@{entry.user.username}</p>
            )}
          </div>
          {entry.user.tier !== "STANDARD" && (
            <FeeTierBadge tier={entry.user.tier} size="sm" showIcon={false} />
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <span
          className={cn(
            "font-mono font-semibold",
            parseFloat(entry.metric.value) >= 0 ? "text-long" : "text-short"
          )}
        >
          {entry.metric.formatted}
        </span>
      </td>
      <td className="px-3 py-2 text-right text-sm text-muted-foreground">
        {entry.additionalStats?.trades}
      </td>
      <td className="px-3 py-2 text-right text-sm text-muted-foreground">
        {entry.additionalStats?.winRate}%
      </td>
    </tr>
  );
}

// ============================================
// Metric Label Helper
// ============================================

function getMetricLabel(type: LeaderboardType): string {
  const labels: Record<LeaderboardType, string> = {
    pnl: "PnL",
    pnl_percent: "PnL %",
    volume: "Volume",
    win_rate: "Win Rate",
    streak: "Win Streak",
    degen: "Avg Leverage",
  };
  return labels[type];
}

// ============================================
// Main Leaderboard Component
// ============================================

interface LeaderboardProps {
  initialType?: LeaderboardType;
  initialTimeframe?: LeaderboardTimeframe;
}

export function Leaderboard({
  initialType = "pnl",
  initialTimeframe = "weekly",
}: LeaderboardProps) {
  const [type, setType] = useState<LeaderboardType>(initialType);
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>(initialTimeframe);
  const { address } = useAccount();
  const { data: leaderboard, isLoading } = useLeaderboard(type, timeframe);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[2, 1, 3].map((pos) => (
            <div
              key={pos}
              className={cn(
                "bg-muted animate-pulse rounded-lg",
                PODIUM_STYLES[pos as 1 | 2 | 3].height,
                PODIUM_STYLES[pos as 1 | 2 | 3].order
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  const userEntry = leaderboard?.entries.find(
    (e) => e.user.address.toLowerCase() === address?.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Tabs value={type} onValueChange={(v) => setType(v as LeaderboardType)}>
          <TabsList>
            <TabsTrigger value="pnl">PnL</TabsTrigger>
            <TabsTrigger value="pnl_percent">PnL %</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="win_rate">Win Rate</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as LeaderboardTimeframe)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* User's rank highlight (if not in top 100) */}
      {userEntry && userEntry.rank > 100 && (
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
          <p className="text-sm text-muted-foreground mb-2">Your Ranking</p>
          <table className="w-full text-sm">
            <tbody>
              <LeaderboardRow entry={userEntry} highlight />
            </tbody>
          </table>
        </div>
      )}

      {/* Podium (Top 3) */}
      <div className="grid grid-cols-3 gap-4">
        <PodiumCard entry={leaderboard?.entries[1]} position={2} />
        <PodiumCard entry={leaderboard?.entries[0]} position={1} />
        <PodiumCard entry={leaderboard?.entries[2]} position={3} />
      </div>

      {/* Full leaderboard */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <ScrollArea className="h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium w-20">Rank</th>
                <th className="px-3 py-2 font-medium">Trader</th>
                <th className="px-3 py-2 font-medium text-right">{getMetricLabel(type)}</th>
                <th className="px-3 py-2 font-medium text-right">Trades</th>
                <th className="px-3 py-2 font-medium text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.entries.slice(3).map((entry) => (
                <LeaderboardRow
                  key={entry.user.address}
                  entry={entry}
                  highlight={entry.user.address.toLowerCase() === address?.toLowerCase()}
                />
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Stats footer */}
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{leaderboard?.totalParticipants.toLocaleString()} participants</span>
        <span>
          Updated{" "}
          {leaderboard?.updatedAt &&
            new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.round(
                (leaderboard.updatedAt.getTime() - Date.now()) / (1000 * 60)
              ),
              "minutes"
            )}
        </span>
      </div>
    </div>
  );
}
