"use client";

import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { useTradingStore, selectAccountValue, selectWithdrawable } from "@/store/trading-store";
import { formatUSD, formatPnL } from "@/lib/utils";
import { Wallet, TrendingUp, Shield, ArrowUpRight } from "lucide-react";

export function AccountInfo() {
  const { isConnected } = useAccount();
  const accountState = useTradingStore((s) => s.accountState);
  const accountValue = useTradingStore(selectAccountValue);
  const withdrawable = useTradingStore(selectWithdrawable);
  const positions = useTradingStore((s) => s.positions);

  // Calculate total unrealized PnL
  const totalUnrealizedPnl = positions.reduce((acc, pos) => {
    return acc + parseFloat(pos.unrealizedPnl || "0");
  }, 0);

  // Calculate margin usage
  const totalMarginUsed = parseFloat(accountState?.marginSummary.totalMarginUsed || "0");
  const marginUsagePercent = parseFloat(accountValue) > 0
    ? (totalMarginUsed / parseFloat(accountValue)) * 100
    : 0;

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-zinc-500">
            <Wallet className="h-5 w-5" />
            <span className="text-sm">Connect wallet to view account</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Account Value */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Wallet className="h-3.5 w-3.5" />
              <span>Account Value</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatUSD(accountValue)}
            </div>
          </div>

          {/* Unrealized PnL */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Unrealized PnL</span>
            </div>
            <div
              className={`text-lg font-semibold ${
                totalUnrealizedPnl >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {formatPnL(totalUnrealizedPnl)}
            </div>
          </div>

          {/* Available Margin */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Available</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatUSD(withdrawable)}
            </div>
          </div>

          {/* Margin Usage */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Shield className="h-3.5 w-3.5" />
              <span>Margin Used</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-700">
                <div
                  className={`h-full transition-all ${
                    marginUsagePercent > 80
                      ? "bg-red-500"
                      : marginUsagePercent > 50
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(marginUsagePercent, 100)}%` }}
                />
              </div>
              <span className="text-sm text-zinc-400">
                {marginUsagePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
