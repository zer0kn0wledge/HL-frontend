// ============================================
// Hyperliquid SDK Utilities
// ============================================

import * as hl from "@nktkas/hyperliquid";
import type { WalletClient } from "viem";
import { BUILDER_CONFIG, PERP_ASSET_INDEXES, API } from "./constants";
import type {
  Market,
  MarketType,
  MarketStats,
  Orderbook,
  Candle,
  CandleInterval,
  RecentTrade,
} from "@/types";
import BigNumber from "bignumber.js";

// ============================================
// Singleton Instances
// ============================================

let infoClientInstance: hl.InfoClient | null = null;
let subscriptionClientInstance: hl.SubscriptionClient | null = null;
let wsTransport: hl.WebSocketTransport | null = null;

export function getInfoClient(): hl.InfoClient {
  if (!infoClientInstance) {
    infoClientInstance = new hl.InfoClient({
      transport: new hl.HttpTransport(),
    });
  }
  return infoClientInstance;
}

export async function getSubscriptionClient(): Promise<hl.SubscriptionClient> {
  if (!subscriptionClientInstance) {
    wsTransport = new hl.WebSocketTransport();
    subscriptionClientInstance = new hl.SubscriptionClient({
      transport: wsTransport,
    });
  }
  return subscriptionClientInstance;
}

export function closeWebSocket(): void {
  if (wsTransport) {
    wsTransport.close();
    wsTransport = null;
    subscriptionClientInstance = null;
  }
}

export function isWsConnected(): boolean {
  return subscriptionClientInstance !== null;
}

// ============================================
// Exchange Client Factory
// ============================================

export function createExchangeClient(walletClient: WalletClient) {
  return new hl.ExchangeClient({
    wallet: walletClient as any,
    transport: new hl.HttpTransport(),
  });
}

// ============================================
// Builder Fee Management
// ============================================

export async function approveBuilderFee(
  exchangeClient: hl.ExchangeClient
): Promise<void> {
  await exchangeClient.approveBuilderFee({
    builder: BUILDER_CONFIG.address,
    maxFeeRate: BUILDER_CONFIG.maxFeeRate,
  });
}

export async function checkBuilderApproval(address: string): Promise<boolean> {
  const infoClient = getInfoClient();
  try {
    const referral = await infoClient.referral({ user: address });
    const referrerState = (referral as any)?.referrerState;
    if (referrerState?.stage === "ready" && referrerState?.data?.builderFeeApprovals) {
      return referrerState.data.builderFeeApprovals.some(
        (approval: { builder: string }) =>
          approval.builder.toLowerCase() === BUILDER_CONFIG.address.toLowerCase()
      );
    }
    return false;
  } catch (error) {
    console.error("Error checking builder approval:", error);
    return false;
  }
}

// ============================================
// Order Functions
// ============================================

export interface PlaceOrderParams {
  exchangeClient: hl.ExchangeClient;
  assetIndex: number;
  isBuy: boolean;
  price: string;
  size: string;
  reduceOnly?: boolean;
  orderType: "limit" | "market";
  timeInForce?: "Gtc" | "Ioc" | "Alo";
  cloid?: string;
}

export async function placeOrder(params: PlaceOrderParams) {
  const {
    exchangeClient,
    assetIndex,
    isBuy,
    price,
    size,
    reduceOnly = false,
    orderType,
    timeInForce = "Gtc",
    cloid,
  } = params;

  const orderSpec =
    orderType === "market"
      ? { limit: { tif: "FrontendMarket" as const } }
      : { limit: { tif: timeInForce } };

  const order: any = {
    a: assetIndex,
    b: isBuy,
    p: price,
    s: size,
    r: reduceOnly,
    t: orderSpec,
  };

  if (cloid) {
    order.c = cloid;
  }

  const result = await exchangeClient.order({
    orders: [order],
    grouping: "na",
    builder: {
      b: BUILDER_CONFIG.address,
      f: BUILDER_CONFIG.feeRate,
    },
  });

  return result;
}

export interface PlaceTriggerOrderParams {
  exchangeClient: hl.ExchangeClient;
  assetIndex: number;
  isBuy: boolean;
  triggerPrice: string;
  size: string;
  limitPrice?: string;
  reduceOnly?: boolean;
  tpsl: "tp" | "sl";
}

export async function placeTriggerOrder(params: PlaceTriggerOrderParams) {
  const {
    exchangeClient,
    assetIndex,
    isBuy,
    triggerPrice,
    size,
    limitPrice,
    reduceOnly = true,
    tpsl,
  } = params;

  const orderSpec = limitPrice
    ? {
        trigger: {
          isMarket: false,
          triggerPx: triggerPrice,
          tpsl,
        },
      }
    : {
        trigger: {
          isMarket: true,
          triggerPx: triggerPrice,
          tpsl,
        },
      };

  const result = await exchangeClient.order({
    orders: [
      {
        a: assetIndex,
        b: isBuy,
        p: limitPrice || triggerPrice,
        s: size,
        r: reduceOnly,
        t: orderSpec,
      },
    ],
    grouping: "na",
    builder: {
      b: BUILDER_CONFIG.address,
      f: BUILDER_CONFIG.feeRate,
    },
  });

  return result;
}

export interface PlaceTwapParams {
  exchangeClient: hl.ExchangeClient;
  assetIndex: number;
  isBuy: boolean;
  size: string;
  reduceOnly?: boolean;
  minutes: number;
  randomize?: boolean;
}

export async function placeTwapOrder(params: PlaceTwapParams) {
  const {
    exchangeClient,
    assetIndex,
    isBuy,
    size,
    reduceOnly = false,
    minutes,
    randomize = true,
  } = params;

  const result = await exchangeClient.twapOrder({
    twap: {
      a: assetIndex,
      b: isBuy,
      s: size,
      r: reduceOnly,
      m: minutes,
      t: randomize,
    },
  });

  return result;
}

export async function cancelOrder(
  exchangeClient: hl.ExchangeClient,
  assetIndex: number,
  orderId: number
) {
  return await exchangeClient.cancel({
    cancels: [{ a: assetIndex, o: orderId }],
  });
}

export async function cancelAllOrders(
  exchangeClient: hl.ExchangeClient,
  assetIndex?: number
) {
  if (assetIndex !== undefined) {
    // Cancel all orders for specific asset
    return await exchangeClient.cancel({
      cancels: [{ a: assetIndex, o: -1 }], // -1 cancels all
    });
  }
  // Cancel all orders
  return await exchangeClient.cancelByCloid({ cancels: [] });
}

export async function cancelTwapOrder(
  exchangeClient: hl.ExchangeClient,
  assetIndex: number,
  twapId: number
) {
  return await exchangeClient.twapCancel({
    a: assetIndex,
    t: twapId,
  });
}

// ============================================
// Leverage & Margin
// ============================================

export async function updateLeverage(
  exchangeClient: hl.ExchangeClient,
  assetIndex: number,
  leverage: number,
  isCross: boolean = true
) {
  return await exchangeClient.updateLeverage({
    asset: assetIndex,
    leverage,
    isCross,
  });
}

export async function updateIsolatedMargin(
  exchangeClient: hl.ExchangeClient,
  assetIndex: number,
  isBuy: boolean,
  amount: number
) {
  return await exchangeClient.updateIsolatedMargin({
    asset: assetIndex,
    isBuy,
    ntli: amount,
  });
}

// ============================================
// Info Queries
// ============================================

export async function getOrderbook(coin: string): Promise<Orderbook> {
  const infoClient = getInfoClient();
  const book = await infoClient.l2Book({ coin });
  return {
    coin,
    levels: book?.levels ?? [[], []],
    time: Date.now(),
  };
}

export async function getAllMids(): Promise<Record<string, string>> {
  const infoClient = getInfoClient();
  return await infoClient.allMids();
}

export async function getMeta() {
  const infoClient = getInfoClient();
  return await infoClient.meta();
}

export async function getSpotMeta() {
  const infoClient = getInfoClient();
  return await infoClient.spotMeta();
}

export async function getMetaAndAssetCtxs() {
  const infoClient = getInfoClient();
  return await infoClient.metaAndAssetCtxs();
}

export async function getSpotMetaAndAssetCtxs() {
  const infoClient = getInfoClient();
  return await infoClient.spotMetaAndAssetCtxs();
}

export async function getClearinghouseState(address: string) {
  const infoClient = getInfoClient();
  return await infoClient.clearinghouseState({ user: address });
}

export async function getSpotClearinghouseState(address: string) {
  const infoClient = getInfoClient();
  return await infoClient.spotClearinghouseState({ user: address });
}

export async function getOpenOrders(address: string) {
  const infoClient = getInfoClient();
  return await infoClient.openOrders({ user: address });
}

export async function getUserFills(address: string) {
  const infoClient = getInfoClient();
  return await infoClient.userFills({ user: address });
}

export async function getRecentTrades(coin: string): Promise<RecentTrade[]> {
  const infoClient = getInfoClient();
  const trades = await infoClient.recentTrades({ coin });
  return trades.map((t: any) => ({
    coin,
    px: t.px,
    sz: t.sz,
    side: t.side,
    time: t.time,
    hash: t.hash || "",
  }));
}

export async function getCandles(
  coin: string,
  interval: CandleInterval,
  startTime?: number,
  endTime?: number
): Promise<Candle[]> {
  const infoClient = getInfoClient();
  const now = Date.now();
  const candles = await infoClient.candleSnapshot({
    coin,
    interval,
    startTime: startTime || now - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    endTime: endTime || now,
  });

  return candles.map((c: any) => ({
    t: c.t,
    o: c.o,
    h: c.h,
    l: c.l,
    c: c.c,
    v: c.v,
    n: c.n,
  }));
}

export async function getFundingHistory(address: string, startTime?: number) {
  const infoClient = getInfoClient();
  return await infoClient.userFunding({
    user: address,
    startTime: startTime || Date.now() - 7 * 24 * 60 * 60 * 1000,
    endTime: Date.now(),
  });
}

// ============================================
// Market Data Processing
// ============================================

export async function fetchPerpMarkets(): Promise<Market[]> {
  const [meta, assetCtxs] = await getMetaAndAssetCtxs();

  return (meta as any).universe.map((asset: any, index: number) => {
    const ctx = (assetCtxs as any[])[index];
    return {
      type: "perp" as MarketType,
      coin: asset.name,
      name: `${asset.name}-PERP`,
      szDecimals: asset.szDecimals,
      pxDecimals: calculatePriceDecimals(ctx?.markPx || "0"),
      minSz: new BigNumber(1).shiftedBy(-asset.szDecimals).toString(),
      tickSize: "0.01",
      maxLeverage: asset.maxLeverage,
      perpMeta: {
        name: asset.name,
        szDecimals: asset.szDecimals,
        maxLeverage: asset.maxLeverage,
        onlyIsolated: asset.onlyIsolated || false,
      },
    };
  });
}

export async function fetchSpotMarkets(): Promise<Market[]> {
  try {
    const [spotMeta, assetCtxs] = await getSpotMetaAndAssetCtxs();
    const spotTokens = (spotMeta as any).tokens || [];

    return (spotMeta as any).universe.map((asset: any, index: number) => {
      const ctx = (assetCtxs as any[])[index];
      const tokens = asset.tokens;

      // Create display name from token pair
      let displayName = asset.name;
      if (tokens && tokens.length >= 2) {
        // Handle both formats: tokens can be objects with index property or direct indices
        const baseTokenIndex = typeof tokens[0] === 'object' ? tokens[0].index : tokens[0];
        const quoteTokenIndex = typeof tokens[1] === 'object' ? tokens[1].index : tokens[1];

        const baseToken = spotTokens[baseTokenIndex];
        const quoteToken = spotTokens[quoteTokenIndex];

        if (baseToken?.name && quoteToken?.name) {
          displayName = `${baseToken.name}/${quoteToken.name}`;
        }
      }

      // Get size decimals properly
      const baseTokenIndex = tokens && tokens.length >= 1
        ? (typeof tokens[0] === 'object' ? tokens[0].index : tokens[0])
        : 0;
      const szDecimals = spotTokens[baseTokenIndex]?.szDecimals || 8;

      return {
        type: "spot" as MarketType,
        coin: asset.name,
        name: displayName,
        szDecimals,
        pxDecimals: calculatePriceDecimals(ctx?.midPx || "0"),
        minSz: new BigNumber(1).shiftedBy(-szDecimals).toString(),
        tickSize: "0.0001",
        spotMeta: {
          tokens,
          name: asset.name,
          displayName,
          index,
          isCanonical: asset.isCanonical !== false,
        },
      };
    });
  } catch (error) {
    console.error("Error fetching spot markets:", error);
    return [];
  }
}

// ============================================
// HIP-3 Markets (Builder-operated spot pairs)
// ============================================

export async function fetchHip3Markets(): Promise<Market[]> {
  try {
    // HIP-3 markets are builder-operated spot pairs that can be fetched from spot meta
    // They typically have isCanonical: false or are in a separate section
    const [spotMeta, assetCtxs] = await getSpotMetaAndAssetCtxs();
    const spotTokens = (spotMeta as any).tokens || [];
    const universe = (spotMeta as any).universe || [];

    // Filter for HIP-3 markets (non-canonical markets with builder info)
    const hip3Markets = universe
      .map((asset: any, index: number) => {
        // Skip canonical markets
        if (asset.isCanonical !== false) return null;

        const ctx = (assetCtxs as any[])[index];
        const tokens = asset.tokens;

        // Create display name from token pair
        let displayName = asset.name;
        if (tokens && tokens.length >= 2) {
          const baseTokenIndex = typeof tokens[0] === 'object' ? tokens[0].index : tokens[0];
          const quoteTokenIndex = typeof tokens[1] === 'object' ? tokens[1].index : tokens[1];

          const baseToken = spotTokens[baseTokenIndex];
          const quoteToken = spotTokens[quoteTokenIndex];

          if (baseToken?.name && quoteToken?.name) {
            displayName = `${baseToken.name}/${quoteToken.name}`;
          }
        }

        const baseTokenIndex = tokens && tokens.length >= 1
          ? (typeof tokens[0] === 'object' ? tokens[0].index : tokens[0])
          : 0;
        const szDecimals = spotTokens[baseTokenIndex]?.szDecimals || 8;

        return {
          type: "hip3" as MarketType,
          coin: asset.name,
          name: displayName,
          szDecimals,
          pxDecimals: calculatePriceDecimals(ctx?.midPx || "0"),
          minSz: new BigNumber(1).shiftedBy(-szDecimals).toString(),
          tickSize: "0.0001",
          hip3Meta: {
            name: asset.name,
            builderAddress: asset.builder || "",
            feeRate: asset.feeRate || 0,
            tokens,
          },
        };
      })
      .filter(Boolean);

    return hip3Markets;
  } catch (error) {
    console.error("Error fetching HIP-3 markets:", error);
    return [];
  }
}

export async function fetchMarketStats(): Promise<Record<string, MarketStats>> {
  const [meta, assetCtxs] = await getMetaAndAssetCtxs();
  const stats: Record<string, MarketStats> = {};

  (meta as any).universe.forEach((asset: any, index: number) => {
    const ctx = (assetCtxs as any[])[index];
    if (ctx) {
      stats[asset.name] = {
        coin: asset.name,
        markPx: ctx.markPx,
        midPx: ctx.midPx,
        oraclePx: ctx.oraclePx,
        prevDayPx: ctx.prevDayPx,
        dayNtlVlm: ctx.dayNtlVlm,
        premium: ctx.premium,
        openInterest: ctx.openInterest,
        funding: ctx.funding,
        impactPxs: ctx.impactPxs,
      };
    }
  });

  return stats;
}

function calculatePriceDecimals(price: string): number {
  const num = new BigNumber(price);
  if (num.isZero()) return 2;
  if (num.gte(1000)) return 2;
  if (num.gte(1)) return 4;
  return 6;
}

// ============================================
// WebSocket Subscriptions
// ============================================

export async function subscribeToOrderbook(
  coin: string,
  callback: (data: Orderbook) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.l2Book({ coin }, (data: any) => {
    callback({
      coin,
      levels: data.levels,
      time: Date.now(),
    });
  });
}

export async function subscribeToTrades(
  coin: string,
  callback: (trades: RecentTrade[]) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.trades({ coin }, (data: any) => {
    const trades: RecentTrade[] = (data || []).map((t: any) => ({
      coin,
      px: t.px,
      sz: t.sz,
      side: t.side,
      time: t.time,
      hash: t.hash || "",
    }));
    callback(trades);
  });
}

export async function subscribeToUserFills(
  address: string,
  callback: (fills: any[]) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.userFills({ user: address }, (data: any) => {
    callback(data.fills || []);
  });
}

export async function subscribeToOrderUpdates(
  address: string,
  callback: (data: any) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.orderUpdates({ user: address }, callback);
}

export async function subscribeToAllMids(
  callback: (mids: Record<string, string>) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.allMids((data: any) => {
    callback(data.mids || data);
  });
}

export async function subscribeToCandles(
  coin: string,
  interval: CandleInterval,
  callback: (candle: Candle) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.candle({ coin, interval }, (data: any) => {
    callback({
      t: data.t,
      o: data.o,
      h: data.h,
      l: data.l,
      c: data.c,
      v: data.v,
      n: data.n,
    });
  });
}

export async function subscribeToUserEvents(
  address: string,
  callback: (data: any) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.userEvents({ user: address }, callback);
}

// ============================================
// Asset Index Helpers
// ============================================

export function getAssetIndex(coin: string): number {
  return PERP_ASSET_INDEXES[coin] ?? -1;
}

export function coinFromAssetIndex(index: number): string | undefined {
  return Object.entries(PERP_ASSET_INDEXES).find(([_, i]) => i === index)?.[0];
}
