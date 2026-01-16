// Hyperliquid Types

export interface Asset {
  name: string;
  szDecimals: number;
  maxLeverage: number;
}

export interface Position {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
  marginUsed: string;
  leverage: {
    type: "cross" | "isolated";
    value: number;
  };
}

export interface OpenOrder {
  coin: string;
  oid: number;
  side: "B" | "A";
  limitPx: string;
  sz: string;
  timestamp: number;
  origSz: string;
  reduceOnly: boolean;
}

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
  tid: number;
}

export interface OrderbookLevel {
  px: string;
  sz: string;
  n: number;
}

export interface Orderbook {
  coin: string;
  levels: [OrderbookLevel[], OrderbookLevel[]]; // [bids, asks]
  time: number;
}

export interface MarketData {
  coin: string;
  midPx: string;
  markPx: string;
  dayChange: string;
  volume24h: string;
  openInterest: string;
  funding: string;
}

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
  };
  assetPositions: {
    position: Position;
  }[];
}

export interface OrderParams {
  coin: string;
  isBuy: boolean;
  size: string;
  price: string;
  orderType: "limit" | "market";
  reduceOnly: boolean;
  timeInForce: "Gtc" | "Ioc" | "Alo";
}

export interface BuilderConfig {
  address: string;
  feeRate: number; // in 1/10000th of bps
}

export type OrderSide = "buy" | "sell";
export type TimeInForce = "Gtc" | "Ioc" | "Alo";
