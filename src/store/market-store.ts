// ============================================
// Market Store - Market Data and Prices
// ============================================

import { create } from "zustand";
import type {
  Market,
  MarketStats,
  MarketType,
  Orderbook,
  ProcessedOrderbook,
  GroupedLevel,
  RecentTrade,
  Candle,
  CandleInterval,
} from "@/types";
import BigNumber from "bignumber.js";

interface MarketState {
  // Market metadata
  perpMarkets: Market[];
  spotMarkets: Market[];
  hip3Markets: Market[];

  // Market stats (mid prices, volume, etc.)
  marketStats: Record<string, MarketStats>;

  // Orderbook
  orderbook: Orderbook | null;
  orderbookGrouping: number;
  processedOrderbook: ProcessedOrderbook | null;

  // Recent trades
  recentTrades: RecentTrade[];

  // Candles for chart
  candles: Candle[];
  candleInterval: CandleInterval;

  // Price tracking
  previousPrices: Record<string, string>;
  priceFlash: Record<string, "up" | "down" | "none">;

  // Actions
  setMarkets: (type: MarketType, markets: Market[]) => void;
  setMarketStats: (stats: Record<string, MarketStats>) => void;
  updateMarketStats: (coin: string, stats: Partial<MarketStats>) => void;
  setOrderbook: (orderbook: Orderbook | null) => void;
  setOrderbookGrouping: (grouping: number) => void;
  addRecentTrade: (trade: RecentTrade) => void;
  setRecentTrades: (trades: RecentTrade[]) => void;
  setCandles: (candles: Candle[]) => void;
  addCandle: (candle: Candle) => void;
  setCandleInterval: (interval: CandleInterval) => void;
  updatePrice: (coin: string, price: string) => void;
  clearPriceFlash: (coin: string) => void;
  reset: () => void;
}

const initialState = {
  perpMarkets: [],
  spotMarkets: [],
  hip3Markets: [],
  marketStats: {},
  orderbook: null,
  orderbookGrouping: 1,
  processedOrderbook: null,
  recentTrades: [],
  candles: [],
  candleInterval: "15m" as CandleInterval,
  previousPrices: {},
  priceFlash: {},
};

// Helper to process orderbook with grouping
function processOrderbook(
  orderbook: Orderbook | null,
  grouping: number
): ProcessedOrderbook | null {
  if (!orderbook) return null;

  const [rawBids, rawAsks] = orderbook.levels;

  const groupLevels = (
    levels: { px: string; sz: string; n: number }[],
    isAsk: boolean
  ): GroupedLevel[] => {
    const grouped: Map<string, { size: BigNumber; count: number }> = new Map();

    for (const level of levels) {
      const price = new BigNumber(level.px);
      const groupedPrice = isAsk
        ? price.dividedBy(grouping).integerValue(BigNumber.ROUND_CEIL).times(grouping)
        : price.dividedBy(grouping).integerValue(BigNumber.ROUND_FLOOR).times(grouping);

      const key = groupedPrice.toString();
      const existing = grouped.get(key);

      if (existing) {
        grouped.set(key, {
          size: existing.size.plus(level.sz),
          count: existing.count + level.n,
        });
      } else {
        grouped.set(key, {
          size: new BigNumber(level.sz),
          count: level.n,
        });
      }
    }

    // Convert to array and calculate totals
    const result: GroupedLevel[] = [];
    let runningTotal = new BigNumber(0);

    const entries = Array.from(grouped.entries());
    // Sort: bids descending, asks ascending
    entries.sort((a, b) =>
      isAsk
        ? new BigNumber(a[0]).minus(b[0]).toNumber()
        : new BigNumber(b[0]).minus(a[0]).toNumber()
    );

    for (const [price, data] of entries) {
      runningTotal = runningTotal.plus(data.size);
      result.push({
        price,
        size: data.size.toString(),
        total: runningTotal.toString(),
        count: data.count,
        percentage: 0, // Will be calculated after
      });
    }

    // Calculate percentages
    const maxTotal = runningTotal;
    for (const level of result) {
      level.percentage = maxTotal.gt(0)
        ? new BigNumber(level.total).dividedBy(maxTotal).times(100).toNumber()
        : 0;
    }

    return result.slice(0, 20); // Limit to 20 levels
  };

  const bids = groupLevels(rawBids, false);
  const asks = groupLevels(rawAsks, true);

  // Calculate spread
  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;
  let spread = "0";
  let spreadPercent = "0";
  let midPrice = "0";

  if (bestBid && bestAsk) {
    const bid = new BigNumber(bestBid);
    const ask = new BigNumber(bestAsk);
    spread = ask.minus(bid).toString();
    midPrice = bid.plus(ask).dividedBy(2).toString();
    spreadPercent = new BigNumber(spread).dividedBy(midPrice).times(100).toFixed(4);
  }

  return { bids, asks, spread, spreadPercent, midPrice };
}

export const useMarketStore = create<MarketState>((set, get) => ({
  ...initialState,

  setMarkets: (type, markets) => {
    switch (type) {
      case "perp":
        set({ perpMarkets: markets });
        break;
      case "spot":
        set({ spotMarkets: markets });
        break;
      case "hip3":
        set({ hip3Markets: markets });
        break;
    }
  },

  setMarketStats: (stats) => set({ marketStats: stats }),

  updateMarketStats: (coin, stats) =>
    set((state) => ({
      marketStats: {
        ...state.marketStats,
        [coin]: { ...state.marketStats[coin], ...stats } as MarketStats,
      },
    })),

  setOrderbook: (orderbook) => {
    const { orderbookGrouping } = get();
    set({
      orderbook,
      processedOrderbook: processOrderbook(orderbook, orderbookGrouping),
    });
  },

  setOrderbookGrouping: (grouping) => {
    const { orderbook } = get();
    set({
      orderbookGrouping: grouping,
      processedOrderbook: processOrderbook(orderbook, grouping),
    });
  },

  addRecentTrade: (trade) =>
    set((state) => ({
      recentTrades: [trade, ...state.recentTrades].slice(0, 50),
    })),

  setRecentTrades: (trades) => set({ recentTrades: trades }),

  setCandles: (candles) => set({ candles }),

  addCandle: (candle) =>
    set((state) => {
      const existing = state.candles.findIndex((c) => c.t === candle.t);
      if (existing >= 0) {
        // Update existing candle
        const newCandles = [...state.candles];
        newCandles[existing] = candle;
        return { candles: newCandles };
      }
      // Add new candle
      return { candles: [...state.candles, candle].slice(-500) };
    }),

  setCandleInterval: (interval) => set({ candleInterval: interval }),

  updatePrice: (coin, price) =>
    set((state) => {
      const prevPrice = state.previousPrices[coin];
      let flash: "up" | "down" | "none" = "none";

      if (prevPrice) {
        const prev = new BigNumber(prevPrice);
        const curr = new BigNumber(price);
        if (curr.gt(prev)) flash = "up";
        else if (curr.lt(prev)) flash = "down";
      }

      return {
        previousPrices: { ...state.previousPrices, [coin]: price },
        priceFlash: { ...state.priceFlash, [coin]: flash },
      };
    }),

  clearPriceFlash: (coin) =>
    set((state) => ({
      priceFlash: { ...state.priceFlash, [coin]: "none" },
    })),

  reset: () => set(initialState),
}));

// Selectors
export const selectMarket = (state: MarketState, type: MarketType, coin: string) => {
  const markets =
    type === "perp"
      ? state.perpMarkets
      : type === "spot"
        ? state.spotMarkets
        : state.hip3Markets;
  return markets.find((m) => m.coin === coin);
};

export const selectMidPrice = (state: MarketState, coin: string) =>
  state.marketStats[coin]?.midPx || "0";

export const selectMarkPrice = (state: MarketState, coin: string) =>
  state.marketStats[coin]?.markPx || "0";

export const selectPriceChange24h = (state: MarketState, coin: string) => {
  const stats = state.marketStats[coin];
  if (!stats?.midPx || !stats?.prevDayPx) return "0";

  const current = new BigNumber(stats.midPx);
  const prev = new BigNumber(stats.prevDayPx);

  if (prev.isZero()) return "0";

  return current.minus(prev).dividedBy(prev).times(100).toFixed(2);
};

export const selectVolume24h = (state: MarketState, coin: string) =>
  state.marketStats[coin]?.dayNtlVlm || "0";

export const selectOpenInterest = (state: MarketState, coin: string) =>
  state.marketStats[coin]?.openInterest || "0";

export const selectFundingRate = (state: MarketState, coin: string) =>
  state.marketStats[coin]?.funding || "0";
