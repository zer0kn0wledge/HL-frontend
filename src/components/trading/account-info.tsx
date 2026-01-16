"use client";

import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import {
  useUserStore,
  selectAccountValue,
  selectWithdrawable,
  selectTotalMarginUsed,
  selectTotalPnl,
} from "@/store";
import { Wallet, TrendingUp, Shield, ArrowUpRight } from "lucide-react";
import BigNumber from "bignumber.js";

export function AccountInfo() {
  const { isConnected } = useAccount();
  const accountValue = useUserStore(selectAccountValue);
  const withdrawable = useUserStore(selectWithdrawable);
  const totalMarginUsed = useUserStore(selectTotalMarginUsed);
  const totalPnl = useUserStore(selectTotalPnl);

  // Calculate margin usage percentage
  const accountValueNum = new BigNumber(accountValue);
  const marginUsedNum = new BigNumber(totalMarginUsed);
  const marginUsagePercent = accountValueNum.gt(0)
    ? marginUsedNum.div(accountValueNum).times(100).toNumber()
    : 0;

  const pnlNum = new BigNumber(totalPnl);

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full bg-card rounded-lg border border-border">
        <div className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Wallet className="h-5 w-5" />
            <span className="text-sm">Connect wallet to view account</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Account Value */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span>Account Value</span>
            </div>
            <div className="text-lg font-semibold font-mono">
              ${accountValueNum.toFormat(2)}
            </div>
          </div>

          {/* Unrealized PnL */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Unrealized PnL</span>
            </div>
            <div
              className={cn(
                "text-lg font-semibold font-mono",
                pnlNum.gte(0) ? "text-long" : "text-short"
              )}
            >
              {pnlNum.gte(0) ? "+" : ""}${pnlNum.toFormat(2)}
            </div>
          </div>

          {/* Available Margin */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Available</span>
            </div>
            <div className="text-lg font-semibold font-mono">
              ${new BigNumber(withdrawable).toFormat(2)}
            </div>
          </div>

          {/* Margin Usage */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Margin Used</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    marginUsagePercent > 80
                      ? "bg-short"
                      : marginUsagePercent > 50
                      ? "bg-yellow-500"
                      : "bg-long"
                  )}
                  style={{ width: `${Math.min(marginUsagePercent, 100)}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {marginUsagePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
