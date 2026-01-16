// ============================================
// HyperTerminal Type Definitions
// ============================================

import type BigNumber from "bignumber.js";

// ============================================
// Market Types
// ============================================

export type MarketType = "perp" | "spot" | "hip3";

export interface PerpMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated: boolean;
}

export interface SpotMeta {
  tokens: [SpotToken, SpotToken]; // [base, quote]
  name: string;
  index: number;
  isCanonical: boolean;
}

export interface SpotToken {
  name: string;
  szDecimals: number;
  weiDecimals: number;
  index: number;
  tokenId: string;
  isNative: boolean;
}

export interface Hip3Meta {
  name: string;
  builderAddress: string;
  feeRate: number;
  tokens: [SpotToken, SpotToken];
}

export interface Market {
  type: MarketType;
  coin: string;
  name: string;
  szDecimals: number;
  pxDecimals: number;
  minSz: string;
  tickSize: string;
  maxLeverage?: number; // perps only
  perpMeta?: PerpMeta;
  spotMeta?: SpotMeta;
  hip3Meta?: Hip3Meta;
}

export interface MarketStats {
  coin: string;
  markPx: string;
  midPx: string;
  oraclePx?: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium?: string;
  openInterest?: string;
  funding?: string;
  impactPxs?: [string, string]; // [bid, ask]
}

// ============================================
// Orderbook Types
// ============================================

export interface OrderbookLevel {
  px: string;
  sz: string;
  n: number;
}

export interface GroupedLevel {
  price: string;
  size: string;
  total: string;
  count: number;
  percentage: number;
}

export interface Orderbook {
  coin: string;
  levels: [OrderbookLevel[], OrderbookLevel[]]; // [bids, asks]
  time: number;
}

export interface ProcessedOrderbook {
  bids: GroupedLevel[];
  asks: GroupedLevel[];
  spread: string;
  spreadPercent: string;
  midPrice: string;
}

// ============================================
// Position Types
// ============================================

export interface Position {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
  marginUsed: string;
  maxTradeSz?: string;
  cumFunding?: {
    allTime: string;
    sinceOpen: string;
    sinceChange: string;
  };
  leverage: {
    type: "cross" | "isolated";
    value: number;
    rawUsd?: string;
  };
}

export interface PositionWithTpSl extends Position {
  tpOrders: OpenOrder[];
  slOrders: OpenOrder[];
}

// ============================================
// Order Types
// ============================================

export type OrderType = "limit" | "market" | "stop_market" | "stop_limit" | "twap" | "scaled";
export type OrderSide = "buy" | "sell";
export type TimeInForce = "Gtc" | "Ioc" | "Alo";
export type TriggerType = "tp" | "sl";

export interface OpenOrder {
  coin: string;
  oid: number;
  cloid?: string;
  side: "B" | "A";
  limitPx: string;
  sz: string;
  timestamp: number;
  origSz: string;
  reduceOnly: boolean;
  orderType?: string;
  triggerPx?: string;
  triggerCondition?: "gt" | "lt";
  tpsl?: TriggerType;
  children?: OpenOrder[];
}

export interface OrderRequest {
  coin: string;
  isBuy: boolean;
  sz: string;
  limitPx: string;
  reduceOnly: boolean;
  orderType: {
    limit?: { tif: TimeInForce };
    trigger?: {
      isMarket: boolean;
      triggerPx: string;
      tpsl: TriggerType;
    };
  };
  cloid?: string;
}

export interface TwapOrder {
  coin: string;
  isBuy: boolean;
  sz: string;
  reduceOnly: boolean;
  minutes: number;
  randomize: boolean;
}

export interface ScaledOrder {
  coin: string;
  isBuy: boolean;
  sz: string;
  numOrders: number;
  startPx: string;
  endPx: string;
  reduceOnly: boolean;
}

// ============================================
// Trade Types
// ============================================

export interface Fill {
  coin: string;
  px: string;
  sz: string;
  side: "B" | "A";
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  feeToken?: string;
  tid: number;
  liquidation?: boolean;
  builderFee?: string;
}

export interface RecentTrade {
  coin: string;
  px: string;
  sz: string;
  side: "B" | "A";
  time: number;
  hash: string;
}

// ============================================
// Account Types
// ============================================

export interface AccountState {
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
    withdrawable: string;
  };
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  assetPositions: {
    position: Position;
    type: "oneWay";
  }[];
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  time: number;
}

export interface SpotBalance {
  coin: string;
  hold: string;
  total: string;
  entryNtl?: string;
  token: SpotToken;
}

export interface SpotClearinghouseState {
  balances: SpotBalance[];
}

// ============================================
// Builder Types
// ============================================

export interface BuilderConfig {
  address: string;
  name: string;
  feeRate: number; // in 1/10000th of bps (50 = 0.005%)
  maxFeeRate: string; // human readable max
}

export interface BuilderApproval {
  builder: string;
  maxFeeRate: string;
  nonce: number;
}

export interface ReferralState {
  referrer?: string;
  referredBy?: string;
  builderFeeApprovals: Record<string, string>;
}

// ============================================
// WebSocket Types
// ============================================

export interface WsSubscription {
  type: "l2Book" | "trades" | "allMids" | "userEvents" | "userFills" | "candle" | "orderUpdates";
  coin?: string;
  user?: string;
  interval?: string;
}

export interface WsMessage {
  channel: string;
  data: unknown;
}

// ============================================
// Chart Types
// ============================================

export type CandleInterval = "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M";

export interface Candle {
  t: number; // timestamp
  o: string; // open
  h: string; // high
  l: string; // low
  c: string; // close
  v: string; // volume
  n: number; // trade count
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ============================================
// UI State Types
// ============================================

export interface TradeFormState {
  orderType: OrderType;
  side: OrderSide;
  size: string;
  price: string;
  triggerPrice: string;
  reduceOnly: boolean;
  postOnly: boolean;
  tif: TimeInForce;
  leverage: number;
  marginMode: "cross" | "isolated";
  // TWAP specific
  twapDuration: number;
  twapRandomize: boolean;
  // Scaled specific
  scaledOrders: number;
  scaledStartPrice: string;
  scaledEndPrice: string;
  // TP/SL
  takeProfitPrice: string;
  stopLossPrice: string;
}

export interface NotificationMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  timestamp: number;
  persistent?: boolean;
}

// ============================================
// Settings Types
// ============================================

export interface UserSettings {
  theme: "dark" | "light";
  orderbookGrouping: number;
  defaultLeverage: number;
  defaultMarginMode: "cross" | "isolated";
  confirmOrders: boolean;
  soundEnabled: boolean;
  showPnlPercent: boolean;
  favoriteMarkets: string[];
  defaultTif: TimeInForce;
  slippage: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  status: "ok" | "err";
  response?: T;
  error?: string;
}

export interface OrderResponse {
  status: "ok" | "err";
  response?: {
    type: string;
    data?: {
      statuses: Array<{
        resting?: { oid: number };
        filled?: { totalSz: string; avgPx: string; oid: number };
        error?: string;
      }>;
    };
  };
}

// ============================================
// Utility Types
// ============================================

export type BigNumberish = string | number | BigNumber;

export interface PriceUpdate {
  coin: string;
  price: string;
  change: "up" | "down" | "none";
  timestamp: number;
}

export interface MarketSelector {
  type: MarketType;
  coin: string;
  displayName: string;
  volume24h?: string;
  change24h?: string;
  price?: string;
}
