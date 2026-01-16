"use client";

import { useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { useAppStore, useMarketStore } from "@/store";
import BigNumber from "bignumber.js";

interface TradeRowProps {
  price: string;
  size: string;
  side: "B" | "A";
  time: number;
}

const TradeRow = memo(function TradeRow({ price, size, side, time }: TradeRowProps) {
  const isBuy = side === "B";
  const timeStr = new Date(time).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex items-center text-xs font-mono h-6 px-2 hover:bg-muted/30">
      <span
        className={cn("flex-1 text-left", isBuy ? "text-long" : "text-short")}
      >
        {new BigNumber(price).toFormat(2)}
      </span>
      <span className="flex-1 text-right text-foreground">
        {new BigNumber(size).toFormat(4)}
      </span>
      <span className="flex-1 text-right text-muted-foreground">{timeStr}</span>
    </div>
  );
});

export function RecentTrades() {
  const { currentCoin } = useAppStore();
  const { recentTrades } = useMarketStore();

  const trades = useMemo(() => {
    return recentTrades.filter((t) => t.coin === currentCoin).slice(0, 30);
  }, [recentTrades, currentCoin]);

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium">Recent Trades</h3>
      </div>

      <div className="flex items-center px-2 py-1.5 text-xs text-muted-foreground border-b border-border">
        <span className="flex-1 text-left">Price</span>
        <span className="flex-1 text-right">Size</span>
        <span className="flex-1 text-right">Time</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {trades.length > 0 ? (
          trades.map((trade, i) => (
            <TradeRow
              key={`${trade.time}-${i}`}
              price={trade.px}
              size={trade.sz}
              side={trade.side}
              time={trade.time}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <p className="text-sm text-muted-foreground">No recent trades</p>
          </div>
        )}
      </div>
    </div>
  );
}
