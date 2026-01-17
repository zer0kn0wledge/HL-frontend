"use client";

import { useMemo, useCallback, memo } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppStore, useMarketStore, useSettingsStore, useUserStore } from "@/store";
import { UI } from "@/lib/constants";
import type { GroupedLevel } from "@/types";
import BigNumber from "bignumber.js";

// ============================================
// Order Row Component (Compact)
// ============================================

interface OrderRowProps {
  level: GroupedLevel;
  side: "bid" | "ask";
  isHighlighted?: boolean;
  onClick?: () => void;
}

const OrderRow = memo(function OrderRow({
  level,
  side,
  isHighlighted,
  onClick,
}: OrderRowProps) {
  const isBid = side === "bid";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center text-[10px] font-mono h-[18px] hover:bg-white/5 transition-colors",
        isHighlighted && "bg-primary/10"
      )}
    >
      {/* Depth visualization */}
      <div
        className={cn(
          "absolute top-0 bottom-0 pointer-events-none transition-all",
          isBid ? "right-0 bg-green-500/20" : "left-0 bg-red-500/20"
        )}
        style={{ width: `${Math.min(level.percentage, 100)}%` }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center w-full px-1.5">
        <span
          className={cn(
            "w-[72px] text-left tabular-nums",
            isBid ? "text-green-400" : "text-red-400"
          )}
        >
          {formatOrderbookPrice(level.price)}
        </span>
        <span className="flex-1 text-right text-gray-300 tabular-nums">
          {formatOrderbookSize(level.size)}
        </span>
        <span className="w-16 text-right text-gray-500 tabular-nums">
          {formatOrderbookSize(level.total)}
        </span>
      </div>
    </button>
  );
});

// ============================================
// Helpers
// ============================================

function formatOrderbookPrice(price: string): string {
  const num = new BigNumber(price);
  if (num.gte(10000)) return num.toFormat(2);
  if (num.gte(1000)) return num.toFormat(2);
  if (num.gte(100)) return num.toFormat(3);
  if (num.gte(10)) return num.toFormat(4);
  if (num.gte(1)) return num.toFormat(4);
  return num.toFormat(6);
}

function formatOrderbookSize(size: string): string {
  const num = new BigNumber(size);
  if (num.gte(1000000)) return num.dividedBy(1000000).toFixed(2) + "M";
  if (num.gte(1000)) return num.dividedBy(1000).toFixed(2) + "K";
  if (num.gte(1)) return num.toFixed(3);
  return num.toFixed(4);
}

// ============================================
// Grouping Selector
// ============================================

function GroupingSelector() {
  const { orderbookGrouping, setOrderbookGrouping } = useSettingsStore();
  const { setOrderbookGrouping: setStoreGrouping } = useMarketStore();

  const handleGroupingChange = useCallback(
    (grouping: number) => {
      setOrderbookGrouping(grouping);
      setStoreGrouping(grouping);
    },
    [setOrderbookGrouping, setStoreGrouping]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 gap-0.5 px-1.5 text-[10px]">
          <Layers className="h-2.5 w-2.5" />
          {orderbookGrouping}
          <ChevronDown className="h-2.5 w-2.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-0">
        {UI.ORDERBOOK_GROUPINGS.map((g) => (
          <DropdownMenuItem
            key={g}
            onClick={() => handleGroupingChange(g)}
            className={cn(
              "text-[10px] font-mono px-2 py-1",
              g === orderbookGrouping && "bg-primary/10"
            )}
          >
            {g}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// Spread Display (Compact)
// ============================================

interface SpreadDisplayProps {
  spread: string;
  spreadPercent: string;
  midPrice: string;
}

function SpreadDisplay({ spread, spreadPercent, midPrice }: SpreadDisplayProps) {
  return (
    <div className="flex items-center justify-between px-1.5 py-1 bg-[#50E3C2]/10 border-y border-[#50E3C2]/20">
      <span className="text-xs font-mono font-bold text-[#50E3C2]">
        {formatOrderbookPrice(midPrice)}
      </span>
      <div className="text-[9px] text-gray-400 flex items-center gap-1">
        <span className="font-mono">{new BigNumber(spread).toFixed(2)}</span>
        <span className="text-gray-600">|</span>
        <span className="font-mono">{new BigNumber(spreadPercent).toFixed(3)}%</span>
      </div>
    </div>
  );
}

// ============================================
// Main Orderbook Component
// ============================================

export function Orderbook() {
  const { currentCoin } = useAppStore();
  const { processedOrderbook, marketStats } = useMarketStore();
  const { setPrice } = useUserStore();

  const midPrice = useMemo(() => {
    return processedOrderbook?.midPrice || marketStats[currentCoin]?.midPx || "0";
  }, [processedOrderbook, marketStats, currentCoin]);

  const handlePriceClick = useCallback(
    (price: string) => {
      setPrice(price);
    },
    [setPrice]
  );

  // Take more levels for display (20 each side)
  const displayAsks = useMemo(
    () => (processedOrderbook?.asks || []).slice(0, 20).reverse(),
    [processedOrderbook]
  );

  const displayBids = useMemo(
    () => (processedOrderbook?.bids || []).slice(0, 20),
    [processedOrderbook]
  );

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-lg border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5">
        <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Order Book</h3>
        <GroupingSelector />
      </div>

      {/* Column Headers */}
      <div className="flex items-center px-1.5 py-1 text-[9px] text-gray-500 border-b border-white/5">
        <span className="w-[72px] text-left">Price</span>
        <span className="flex-1 text-right">Size</span>
        <span className="w-16 text-right">Total</span>
      </div>

      {/* Order Book Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Asks (Sells) */}
        <div className="flex-1 flex flex-col justify-end overflow-hidden">
          {displayAsks.length > 0 ? (
            displayAsks.map((level, i) => (
              <OrderRow
                key={`ask-${level.price}-${i}`}
                level={level}
                side="ask"
                onClick={() => handlePriceClick(level.price)}
              />
            ))
          ) : (
            <div className="flex-1 flex items-end justify-center pb-2">
              <span className="text-[10px] text-gray-600">No asks</span>
            </div>
          )}
        </div>

        {/* Spread */}
        <SpreadDisplay
          spread={processedOrderbook?.spread || "0"}
          spreadPercent={processedOrderbook?.spreadPercent || "0"}
          midPrice={midPrice}
        />

        {/* Bids (Buys) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {displayBids.length > 0 ? (
            displayBids.map((level, i) => (
              <OrderRow
                key={`bid-${level.price}-${i}`}
                level={level}
                side="bid"
                onClick={() => handlePriceClick(level.price)}
              />
            ))
          ) : (
            <div className="flex-1 flex items-start justify-center pt-2">
              <span className="text-[10px] text-gray-600">No bids</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
