"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import {
  User,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Wallet,
  Settings,
  ExternalLink,
  Shield,
  Award,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/trading/header";
import { useUserStore, useAppStore } from "@/store";
import { CreateProfileModal } from "@/components/profile/create-profile-modal";
import { toast } from "sonner";
import BigNumber from "bignumber.js";
import Link from "next/link";

// ============================================
// Profile Stats Card
// ============================================

function StatCard({
  icon,
  label,
  value,
  change,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#50E3C2]/30 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-[#50E3C2]/10 text-[#50E3C2]">{icon}</div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold font-mono text-white">{value}</span>
        {change && (
          <span
            className={`text-sm font-mono ${
              trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-gray-400"
            }`}
          >
            {trend === "up" && "+"}
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Position Summary
// ============================================

function PositionSummary() {
  const { positions } = useUserStore();

  if (positions.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-gray-500 text-sm">No open positions</p>
      </div>
    );
  }

  const totalPnl = positions.reduce(
    (acc, pos) => acc.plus(pos.unrealizedPnl),
    new BigNumber(0)
  );

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Open Positions</h3>
        <span
          className={`text-sm font-mono ${
            totalPnl.gte(0) ? "text-green-400" : "text-red-400"
          }`}
        >
          {totalPnl.gte(0) ? "+" : ""}${totalPnl.toFormat(2)} uPnL
        </span>
      </div>
      <div className="space-y-2">
        {positions.map((pos) => {
          const pnl = new BigNumber(pos.unrealizedPnl);
          const isLong = new BigNumber(pos.szi).gt(0);

          return (
            <div
              key={pos.coin}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isLong ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isLong ? "LONG" : "SHORT"}
                </span>
                <span className="font-mono text-white">{pos.coin}</span>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-mono ${
                    pnl.gte(0) ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {pnl.gte(0) ? "+" : ""}${pnl.toFormat(2)}
                </div>
                <div className="text-[10px] text-gray-500">
                  {new BigNumber(pos.szi).abs().toFormat(4)} @ ${new BigNumber(pos.entryPx).toFormat(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Trading History Chart (Placeholder)
// ============================================

function TradingHistoryChart() {
  const { fills } = useUserStore();

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <h3 className="text-sm font-medium text-white mb-4">Trading Activity</h3>
      {fills.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
          No trading activity yet
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {fills.slice(0, 10).map((fill, i) => {
            const isBuy = fill.side === "B";
            const pnl = new BigNumber(fill.closedPnl);

            return (
              <div
                key={`${fill.coin}-${fill.time}-${i}`}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {isBuy ? "BUY" : "SELL"}
                  </span>
                  <span className="font-mono text-sm text-white">{fill.coin}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">
                    {new BigNumber(fill.sz).toFormat(4)} @ ${new BigNumber(fill.px).toFormat(2)}
                  </div>
                  {!pnl.isZero() && (
                    <div
                      className={`text-[10px] font-mono ${
                        pnl.gte(0) ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {pnl.gte(0) ? "+" : ""}${pnl.toFormat(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// Achievements Preview
// ============================================

function AchievementsPreview() {
  const achievements = [
    { name: "First Trade", icon: "🎯", unlocked: true },
    { name: "10x Leverage", icon: "⚡", unlocked: true },
    { name: "100 Trades", icon: "📈", unlocked: false },
    { name: "Profitable Week", icon: "💰", unlocked: false },
  ];

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Achievements</h3>
        <Link
          href="/achievements"
          className="text-[10px] text-[#50E3C2] hover:underline flex items-center gap-1"
        >
          View All <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {achievements.map((a) => (
          <div
            key={a.name}
            className={`p-2 rounded-lg text-center ${
              a.unlocked ? "bg-[#50E3C2]/10" : "bg-white/5 opacity-50"
            }`}
          >
            <span className="text-xl">{a.icon}</span>
            <p className="text-[9px] text-gray-400 mt-1 truncate">{a.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Profile Page
// ============================================

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { accountState, fills } = useUserStore();
  const [copied, setCopied] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not Connected";

  // Calculate stats
  const accountValue = accountState?.marginSummary?.accountValue || "0";
  const totalPnl = accountState?.marginSummary?.totalRawUsd || "0";
  const totalTrades = fills.length;
  const winningTrades = fills.filter((f) => new BigNumber(f.closedPnl).gt(0)).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-[#50E3C2]/10 to-transparent border border-[#50E3C2]/20"
          >
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#50E3C2] to-emerald-600 flex items-center justify-center">
                  <User className="w-10 h-10 text-black" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#50E3C2]">
                  <Shield className="w-4 h-4 text-black" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">Hypurr Trader</h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#50E3C2]/20 text-[#50E3C2] text-xs font-medium">
                    Level 5
                  </span>
                </div>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 mt-1 text-gray-400 hover:text-white transition-colors"
                >
                  <span className="font-mono text-sm">{shortAddress}</span>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>7 day streak</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span>2 achievements</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateProfile(true)}
                  className="border-[#50E3C2]/30 text-[#50E3C2] hover:bg-[#50E3C2]/10"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Wallet className="w-5 h-5" />}
              label="Account Value"
              value={`$${new BigNumber(accountValue).toFormat(2)}`}
            />
            <StatCard
              icon={
                new BigNumber(totalPnl).gte(0) ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )
              }
              label="Unrealized PnL"
              value={`$${new BigNumber(totalPnl).toFormat(2)}`}
              trend={new BigNumber(totalPnl).gte(0) ? "up" : "down"}
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Total Trades"
              value={totalTrades.toString()}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Win Rate"
              value={`${winRate}%`}
              trend={Number(winRate) >= 50 ? "up" : "down"}
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PositionSummary />
            <TradingHistoryChart />
          </div>

          {/* Achievements */}
          <AchievementsPreview />

          {/* Back to Trading */}
          <div className="text-center pt-4">
            <Link href="/">
              <Button className="bg-[#50E3C2] text-black hover:bg-[#50E3C2]/90">
                Back to Trading
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
      />
    </div>
  );
}
