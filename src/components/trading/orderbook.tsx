"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useTradingStore } from "@/store/trading-store";
import { formatPrice, formatSize, cn } from "@/lib/utils";
import { ORDERBOOK_DEPTH } from "@/lib/constants";

interface OrderbookRowProps {
  price: string;
  size: string;
  total: number;
  maxTotal: number;
  side: "bid" | "ask";
  onClick?: () => void;
}

function OrderbookRow({ price, size, total, maxTotal, side, onClick }: OrderbookRowProps) {
  const percentage = (total / maxTotal) * 100;
  const isBid = side === "bid";

  return (
    <button
      onClick={onClick}
      className="relative flex w-full items-center justify-between px-3 py-1 text-xs hover:bg-zinc-800/50"
    >
      {/* Background bar */}
      <div
        className={cn(
          "absolute inset-y-0 opacity-20",
          isBid ? "right-0 bg-green-500" : "left-0 bg-red-500"
        )}
        style={{ width: `${percentage}%` }}
      />

      {/* Content */}
      <span className={cn("relative z-10 font-mono", isBid ? "text-green-400" : "text-red-400")}>
        {formatPrice(price)}
      </span>
      <span className="relative z-10 font-mono text-zinc-300">{formatSize(size)}</span>
      <span className="relative z-10 font-mono text-zinc-500">{formatSize(total, 2)}</span>
    </button>
  );
}

export function Orderbook() {
  const orderbook = useTradingStore((s) => s.orderbook);
  const selectedCoin = useTradingStore((s) => s.selectedCoin);
  const midPrices = useTradingStore((s) => s.midPrices);

  const { asks, bids, maxTotal, spread, spreadPercent } = useMemo(() => {
    if (!orderbook) {
      return { asks: [], bids: [], maxTotal: 1, spread: "0", spreadPercent: "0" };
    }

    const [rawBids, rawAsks] = orderbook.levels;

    // Process bids (buy orders) - take top N
    let bidTotal = 0;
    const processedBids = rawBids.slice(0, ORDERBOOK_DEPTH).map((level) => {
      bidTotal += parseFloat(level.sz);
      return { ...level, total: bidTotal };
    });

    // Process asks (sell orders) - take top N, reverse for display
    let askTotal = 0;
    const processedAsks = rawAsks
      .slice(0, ORDERBOOK_DEPTH)
      .map((level) => {
        askTotal += parseFloat(level.sz);
        return { ...level, total: askTotal };
      })
      .reverse();

    const maxT = Math.max(bidTotal, askTotal) || 1;

    // Calculate spread
    const bestBid = rawBids[0]?.px ? parseFloat(rawBids[0].px) : 0;
    const bestAsk = rawAsks[0]?.px ? parseFloat(rawAsks[0].px) : 0;
    const spreadVal = bestAsk - bestBid;
    const spreadPct = bestBid > 0 ? (spreadVal / bestBid) * 100 : 0;

    return {
      asks: processedAsks,
      bids: processedBids,
      maxTotal: maxT,
      spread: spreadVal.toFixed(2),
      spreadPercent: spreadPct.toFixed(3),
    };
  }, [orderbook]);

  const midPrice = midPrices[selectedCoin] || "0";

  return (
    <Card className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-medium text-white">Order Book</h3>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 text-xs text-zinc-500">
        <span>Price (USD)</span>
        <span>Size ({selectedCoin})</span>
        <span>Total</span>
      </div>

      {/* Asks (sells) - displayed in reverse order */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-[calc(50%-20px)] flex-col justify-end overflow-hidden">
          {asks.map((level, i) => (
            <OrderbookRow
              key={`ask-${i}`}
              price={level.px}
              size={level.sz}
              total={level.total}
              maxTotal={maxTotal}
              side="ask"
            />
          ))}
        </div>

        {/* Spread / Mid Price */}
        <div className="flex items-center justify-between border-y border-zinc-800 bg-zinc-800/50 px-3 py-2">
          <span className="text-lg font-semibold text-white">
            ${formatPrice(midPrice)}
          </span>
          <span className="text-xs text-zinc-500">
            Spread: ${spread} ({spreadPercent}%)
          </span>
        </div>

        {/* Bids (buys) */}
        <div className="flex h-[calc(50%-20px)] flex-col overflow-hidden">
          {bids.map((level, i) => (
            <OrderbookRow
              key={`bid-${i}`}
              price={level.px}
              size={level.sz}
              total={level.total}
              maxTotal={maxTotal}
              side="bid"
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
