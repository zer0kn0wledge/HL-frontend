// ============================================
// HyperTerminal Constants
// ============================================

import type { BuilderConfig, CandleInterval, TimeInForce, UserSettings } from "@/types";

// ============================================
// Builder Configuration
// ============================================

export const BUILDER_CONFIG: BuilderConfig = {
  address: "0x0000000000000000000000000000000000000000" as const,
  name: "Zero's Hypurr Terminal",
  feeRate: 50, // 50 = 0.005% (in 1/10000th of bps)
  maxFeeRate: "0.05%",
};

// Fee structure
export const FEES = {
  PERP_TAKER: "0.02%", // 2 bps
  PERP_MAKER: "0.01%", // 1 bps (rebate possible)
  SPOT_TAKER: "0.05%", // 5 bps
  SPOT_MAKER: "0.02%", // 2 bps
  HIP3_VARIABLE: true, // varies by pool
} as const;

// ============================================
// Chain Configuration
// ============================================

export const CHAINS = {
  ARBITRUM: {
    id: 42161,
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
  },
  HYPERLIQUID: {
    id: 999,
    name: "HyperEVM",
    rpcUrl: "https://api.hyperliquid.xyz/evm",
  },
} as const;

// ============================================
// API Endpoints
// ============================================

export const ENDPOINTS = {
  MAINNET: {
    INFO: "https://api.hyperliquid.xyz/info",
    EXCHANGE: "https://api.hyperliquid.xyz/exchange",
    WS: "wss://api.hyperliquid.xyz/ws",
  },
  TESTNET: {
    INFO: "https://api.hyperliquid-testnet.xyz/info",
    EXCHANGE: "https://api.hyperliquid-testnet.xyz/exchange",
    WS: "wss://api.hyperliquid-testnet.xyz/ws",
  },
} as const;

export const IS_TESTNET = false;
export const API = IS_TESTNET ? ENDPOINTS.TESTNET : ENDPOINTS.MAINNET;

// ============================================
// Market Configuration
// ============================================

export const DEFAULT_MARKET = {
  coin: "BTC",
  type: "perp" as const,
};

export const POPULAR_PERPS = ["BTC", "ETH", "SOL", "DOGE", "ARB", "OP", "AVAX", "LINK", "SUI", "APT"];
export const POPULAR_SPOTS = ["HYPE", "PURR"];

// Asset Index Mapping (perpetuals)
export const PERP_ASSET_INDEXES: Record<string, number> = {
  BTC: 0,
  ETH: 1,
  ATOM: 2,
  MATIC: 3,
  DOGE: 4,
  SOL: 5,
  AVAX: 6,
  BNB: 7,
  APE: 8,
  OP: 9,
  LTC: 10,
  ARB: 11,
  LINK: 12,
  AAVE: 13,
  UNI: 14,
  SUSHI: 15,
  SNX: 16,
  CRV: 17,
  FTM: 18,
  NEAR: 19,
  GMT: 20,
  INJ: 21,
  CFX: 22,
  STX: 23,
  BLUR: 24,
  SUI: 25,
  APT: 26,
  WLD: 27,
  SEI: 28,
  TIA: 29,
  TON: 30,
  PEPE: 31,
  SHIB: 32,
  BONK: 33,
  WIF: 34,
  JUP: 35,
  STRK: 36,
  PYTH: 37,
  JTO: 38,
  MEME: 39,
  ORDI: 40,
  TAO: 41,
  FET: 42,
  RENDER: 43,
  AR: 44,
  PENDLE: 45,
  ENA: 46,
  W: 47,
  ETHFI: 48,
  REZ: 49,
  NOT: 50,
  IO: 51,
  ZK: 52,
  BLAST: 53,
  ZRO: 54,
  LISTA: 55,
  AERO: 56,
  EIGEN: 57,
  DBR: 58,
  CATI: 59,
  NEIRO: 60,
  GOAT: 61,
  GRASS: 62,
  VIRTUAL: 63,
  HYPE: 64,
  PNUT: 65,
  ACT: 66,
  AI16Z: 67,
  FARTCOIN: 68,
  SONIC: 69,
};

// ============================================
// Trading Defaults
// ============================================

export const TRADING = {
  DEFAULT_LEVERAGE: 10,
  MAX_LEVERAGE: 50,
  MIN_LEVERAGE: 1,
  DEFAULT_MARGIN_MODE: "cross" as const,
  DEFAULT_TIF: "Gtc" as TimeInForce,
  DEFAULT_SLIPPAGE: "0.5",
  MAX_SLIPPAGE: "5",
} as const;

// ============================================
// UI Configuration
// ============================================

export const UI = {
  ORDERBOOK_DEPTH: 20,
  ORDERBOOK_GROUPINGS: [0.01, 0.1, 1, 5, 10, 50, 100],
  TRADES_LIMIT: 50,
  POSITIONS_LIMIT: 100,
  ORDERS_LIMIT: 100,
  FILLS_LIMIT: 100,
  REFRESH_INTERVAL: 5000, // 5 seconds for polling
  WS_RECONNECT_DELAY: 1000,
  WS_MAX_RECONNECT_ATTEMPTS: 10,
  ANIMATION_DURATION: 200,
  PRICE_FLASH_DURATION: 300,
} as const;

// ============================================
// Chart Configuration
// ============================================

export const CHART = {
  DEFAULT_INTERVAL: "15m" as CandleInterval,
  INTERVALS: [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "15m", value: "15m" },
    { label: "1H", value: "1h" },
    { label: "4H", value: "4h" },
    { label: "1D", value: "1d" },
    { label: "1W", value: "1w" },
  ] as { label: string; value: CandleInterval }[],
  CANDLE_LIMIT: 500,
} as const;

// ============================================
// Precision Configuration
// ============================================

export const PRECISION = {
  PRICE: 6,
  SIZE: 6,
  USD: 2,
  PERCENT: 2,
  LEVERAGE: 0,
} as const;

// ============================================
// Order Types
// ============================================

export const ORDER_TYPES = [
  { value: "limit", label: "Limit" },
  { value: "market", label: "Market" },
  { value: "stop_market", label: "Stop Market" },
  { value: "stop_limit", label: "Stop Limit" },
  { value: "twap", label: "TWAP" },
  { value: "scaled", label: "Scaled" },
] as const;

export const TIME_IN_FORCE = [
  { value: "Gtc", label: "GTC", description: "Good til cancelled" },
  { value: "Ioc", label: "IOC", description: "Immediate or cancel" },
  { value: "Alo", label: "ALO", description: "Add liquidity only" },
] as const;

// ============================================
// TWAP Configuration
// ============================================

export const TWAP = {
  MIN_DURATION: 5, // minutes
  MAX_DURATION: 1440, // 24 hours
  DEFAULT_DURATION: 30,
} as const;

// ============================================
// Scaled Orders Configuration
// ============================================

export const SCALED = {
  MIN_ORDERS: 2,
  MAX_ORDERS: 20,
  DEFAULT_ORDERS: 5,
} as const;

// ============================================
// Default User Settings
// ============================================

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  orderbookGrouping: 1,
  defaultLeverage: TRADING.DEFAULT_LEVERAGE,
  defaultMarginMode: TRADING.DEFAULT_MARGIN_MODE,
  confirmOrders: true,
  soundEnabled: true,
  showPnlPercent: true,
  favoriteMarkets: ["BTC", "ETH", "SOL"],
  defaultTif: TRADING.DEFAULT_TIF,
  slippage: TRADING.DEFAULT_SLIPPAGE,
};

// ============================================
// Local Storage Keys
// ============================================

export const STORAGE_KEYS = {
  SETTINGS: "hyperterminal_settings",
  FAVORITES: "hyperterminal_favorites",
  LAST_MARKET: "hyperterminal_last_market",
  LAYOUT: "hyperterminal_layout",
} as const;

// ============================================
// Error Messages
// ============================================

export const ERRORS = {
  WALLET_NOT_CONNECTED: "Please connect your wallet first",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_SIZE: "Invalid order size",
  INVALID_PRICE: "Invalid price",
  BUILDER_NOT_APPROVED: "Builder fee approval required",
  ORDER_FAILED: "Order submission failed",
  NETWORK_ERROR: "Network error. Please try again",
  RATE_LIMITED: "Rate limited. Please wait and try again",
} as const;

// ============================================
// Success Messages
// ============================================

export const SUCCESS = {
  ORDER_PLACED: "Order placed successfully",
  ORDER_CANCELLED: "Order cancelled",
  POSITION_CLOSED: "Position closed",
  LEVERAGE_UPDATED: "Leverage updated",
  BUILDER_APPROVED: "Builder fee approved",
} as const;
