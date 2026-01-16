"use client";

import { useAccount } from "wagmi";
import { useAppStore, useUserStore } from "@/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import BigNumber from "bignumber.js";

export function TradeHistory() {
  const { isConnected } = useAccount();
  const { setCurrentMarket } = useAppStore();
  const { fills } = useUserStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full bg-card rounded-lg border border-border">
        <div className="px-3 py-2 border-b border-border">
          <h3 className="text-sm font-medium">Trade History</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">
            Connect wallet to view trade history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium">
          Trade History ({fills.length})
        </h3>
      </div>

      {fills.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">No trade history</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Market</th>
                <th className="px-3 py-2 font-medium">Side</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Fee</th>
                <th className="px-3 py-2 font-medium">PnL</th>
                <th className="px-3 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {fills.slice(0, 50).map((fill, index) => {
                const isBuy = fill.side === "B";
                const pnl = new BigNumber(fill.closedPnl);
                const hasPnl = !pnl.isZero();
                const fee = new BigNumber(fill.fee);

                return (
                  <tr
                    key={`${fill.hash}-${index}`}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setCurrentMarket("perp", fill.coin)}
                        className="font-medium hover:text-foreground transition-colors"
                      >
                        {fill.coin}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-medium",
                          isBuy ? "bg-long/20 text-long" : "bg-short/20 text-short"
                        )}
                      >
                        {isBuy ? "Buy" : "Sell"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-sm">
                      ${new BigNumber(fill.px).toFormat(2)}
                    </td>
                    <td className="px-3 py-2 font-mono text-sm">
                      {new BigNumber(fill.sz).toFormat(4)}
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground font-mono">
                      ${fee.toFormat(2)}
                    </td>
                    <td className="px-3 py-2">
                      {hasPnl ? (
                        <span
                          className={cn(
                            "font-mono text-sm",
                            pnl.gte(0) ? "text-long" : "text-short"
                          )}
                        >
                          {pnl.gte(0) ? "+" : ""}${pnl.toFormat(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      <div>{formatTime(fill.time)}</div>
                      <div className="text-muted-foreground/70">{formatDate(fill.time)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  );
}
