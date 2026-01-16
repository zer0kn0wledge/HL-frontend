"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  X,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAppStore, useMarketStore, useSettingsStore } from "@/store";
import type { Market, MarketType } from "@/types";
import BigNumber from "bignumber.js";

// ============================================
// Market Row Component
// ============================================

interface MarketRowProps {
  market: Market;
  price?: string;
  change24h?: string;
  volume24h?: string;
  isFavorite: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

function MarketRow({
  market,
  price,
  change24h,
  volume24h,
  isFavorite,
  isSelected,
  onSelect,
  onToggleFavorite,
}: MarketRowProps) {
  const changeNum = parseFloat(change24h || "0");
  const isPositive = changeNum >= 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors rounded-md",
        isSelected ? "bg-primary/10" : "hover:bg-muted"
      )}
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="p-1 hover:bg-accent rounded"
      >
        <Star
          className={cn(
            "h-4 w-4",
            isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
          )}
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{market.name || market.coin}</span>
          <span className="text-xs text-muted-foreground uppercase">
            {market.type}
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className="font-mono text-sm">
          {price ? formatPrice(price) : "-"}
        </div>
        <div
          className={cn(
            "text-xs font-mono flex items-center gap-1 justify-end",
            isPositive ? "text-long" : "text-short"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? "+" : ""}
          {change24h ? `${parseFloat(change24h).toFixed(2)}%` : "-"}
        </div>
      </div>

      <div className="text-right text-xs text-muted-foreground w-20 hidden sm:block">
        {volume24h ? formatVolume(volume24h) : "-"}
      </div>
    </motion.div>
  );
}

// ============================================
// Helpers
// ============================================

function formatPrice(price: string): string {
  const num = new BigNumber(price);
  if (num.gte(1000)) return num.toFormat(2);
  if (num.gte(1)) return num.toFormat(4);
  return num.toFormat(6);
}

function formatVolume(volume: string): string {
  const num = new BigNumber(volume);
  if (num.gte(1e9)) return `$${num.dividedBy(1e9).toFixed(2)}B`;
  if (num.gte(1e6)) return `$${num.dividedBy(1e6).toFixed(2)}M`;
  if (num.gte(1e3)) return `$${num.dividedBy(1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// ============================================
// Market Selector Dialog
// ============================================

interface MarketSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketSelectorDialog({
  open,
  onOpenChange,
}: MarketSelectorDialogProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<MarketType | "favorites">("perp");

  const { currentCoin, currentMarketType, setCurrentMarket } = useAppStore();
  const { perpMarkets, spotMarkets, marketStats } = useMarketStore();
  const { favoriteMarkets, addFavoriteMarket, removeFavoriteMarket } =
    useSettingsStore();

  const allMarkets = useMemo(() => {
    return [...perpMarkets, ...spotMarkets];
  }, [perpMarkets, spotMarkets]);

  const filteredMarkets = useMemo(() => {
    let markets: Market[] = [];

    if (tab === "favorites") {
      markets = allMarkets.filter((m) => favoriteMarkets.includes(m.coin));
    } else if (tab === "perp") {
      markets = perpMarkets;
    } else if (tab === "spot") {
      markets = spotMarkets;
    }

    if (search) {
      const searchLower = search.toLowerCase();
      markets = markets.filter(
        (m) =>
          m.coin.toLowerCase().includes(searchLower) ||
          m.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by volume
    return markets.sort((a, b) => {
      const volA = new BigNumber(marketStats[a.coin]?.dayNtlVlm || 0);
      const volB = new BigNumber(marketStats[b.coin]?.dayNtlVlm || 0);
      return volB.minus(volA).toNumber();
    });
  }, [tab, search, allMarkets, perpMarkets, spotMarkets, favoriteMarkets, marketStats]);

  const handleSelect = useCallback(
    (market: Market) => {
      setCurrentMarket(market.type, market.coin);
      onOpenChange(false);
    },
    [setCurrentMarket, onOpenChange]
  );

  const getChange24h = (coin: string) => {
    const stats = marketStats[coin];
    if (!stats?.midPx || !stats?.prevDayPx) return "0";
    const current = new BigNumber(stats.midPx);
    const prev = new BigNumber(stats.prevDayPx);
    if (prev.isZero()) return "0";
    return current.minus(prev).dividedBy(prev).times(100).toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Select Market</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1">
          <TabsList className="mx-4 mb-2">
            <TabsTrigger value="favorites" className="gap-1">
              <Star className="h-3 w-3" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="perp">Perpetuals</TabsTrigger>
            <TabsTrigger value="spot">Spot</TabsTrigger>
          </TabsList>

          <div className="px-4 pb-2 flex items-center gap-4 text-xs text-muted-foreground border-b border-border">
            <span className="flex-1">Market</span>
            <span className="w-24 text-right">Price / 24h</span>
            <span className="w-20 text-right hidden sm:block">Volume</span>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="p-2">
              <AnimatePresence mode="popLayout">
                {filteredMarkets.length > 0 ? (
                  filteredMarkets.map((market) => (
                    <MarketRow
                      key={`${market.type}-${market.coin}`}
                      market={market}
                      price={marketStats[market.coin]?.midPx}
                      change24h={getChange24h(market.coin)}
                      volume24h={marketStats[market.coin]?.dayNtlVlm}
                      isFavorite={favoriteMarkets.includes(market.coin)}
                      isSelected={
                        market.coin === currentCoin &&
                        market.type === currentMarketType
                      }
                      onSelect={() => handleSelect(market)}
                      onToggleFavorite={() =>
                        favoriteMarkets.includes(market.coin)
                          ? removeFavoriteMarket(market.coin)
                          : addFavoriteMarket(market.coin)
                      }
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {tab === "favorites"
                      ? "No favorite markets yet"
                      : "No markets found"}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Market Selector Button
// ============================================

export function MarketSelectorButton() {
  const { currentCoin, currentMarketType, isMarketSelectorOpen, setMarketSelectorOpen } =
    useAppStore();
  const { marketStats } = useMarketStore();

  const stats = marketStats[currentCoin];
  const price = stats?.midPx;
  const change = useMemo(() => {
    if (!stats?.midPx || !stats?.prevDayPx) return 0;
    const current = new BigNumber(stats.midPx);
    const prev = new BigNumber(stats.prevDayPx);
    if (prev.isZero()) return 0;
    return current.minus(prev).dividedBy(prev).times(100).toNumber();
  }, [stats]);

  const isPositive = change >= 0;

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setMarketSelectorOpen(true)}
        className="h-auto py-1 px-2 gap-2"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{currentCoin}</span>
          <span className="text-xs text-muted-foreground uppercase">
            {currentMarketType}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      <div className="hidden md:flex items-center gap-4 ml-4">
        <div>
          <div className="font-mono text-lg font-medium">
            {price ? formatPrice(price) : "-"}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-mono",
            isPositive ? "text-long" : "text-short"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      </div>

      <MarketSelectorDialog
        open={isMarketSelectorOpen}
        onOpenChange={setMarketSelectorOpen}
      />
    </>
  );
}

// Legacy export for backwards compatibility
export function MarketSelector() {
  return <MarketSelectorButton />;
}
