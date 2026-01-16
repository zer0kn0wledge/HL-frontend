"use client";

import { useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
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
// Order Row Component
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
        "relative flex w-full items-center text-xs font-mono h-6 hover:bg-muted/50 transition-colors",
        isHighlighted && "bg-primary/10"
      )}
    >
      {/* Depth visualization */}
      <div
        className={cn(
          "absolute top-0 bottom-0 pointer-events-none",
          isBid ? "right-0 bg-long/15" : "left-0 bg-short/15"
        )}
        style={{ width: `${Math.min(level.percentage, 100)}%` }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center w-full px-2">
        <span
          className={cn(
            "flex-1 text-left",
            isBid ? "text-long" : "text-short"
          )}
        >
          {formatOrderbookPrice(level.price)}
        </span>
        <span className="flex-1 text-right text-foreground">
          {formatOrderbookSize(level.size)}
        </span>
        <span className="flex-1 text-right text-muted-foreground">
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
        <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
          <Layers className="h-3 w-3" />
          {orderbookGrouping}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {UI.ORDERBOOK_GROUPINGS.map((g) => (
          <DropdownMenuItem
            key={g}
            onClick={() => handleGroupingChange(g)}
            className={cn(
              "text-xs font-mono",
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
// Spread Display
// ============================================

interface SpreadDisplayProps {
  spread: string;
  spreadPercent: string;
  midPrice: string;
}

function SpreadDisplay({ spread, spreadPercent, midPrice }: SpreadDisplayProps) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 border-y border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono font-semibold text-foreground">
          {formatOrderbookPrice(midPrice)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        <span className="font-mono">{new BigNumber(spread).toFixed(2)}</span>
        <span className="mx-1">|</span>
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

  // Take top 15 levels for display
  const displayAsks = useMemo(
    () => (processedOrderbook?.asks || []).slice(0, 15).reverse(),
    [processedOrderbook]
  );

  const displayBids = useMemo(
    () => (processedOrderbook?.bids || []).slice(0, 15),
    [processedOrderbook]
  );

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium">Order Book</h3>
        <GroupingSelector />
      </div>

      {/* Column Headers */}
      <div className="flex items-center px-2 py-1.5 text-xs text-muted-foreground border-b border-border">
        <span className="flex-1 text-left">Price</span>
        <span className="flex-1 text-right">Size</span>
        <span className="flex-1 text-right">Total</span>
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
              <span className="text-xs text-muted-foreground">No asks</span>
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
              <span className="text-xs text-muted-foreground">No bids</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
