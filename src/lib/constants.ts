// Builder Configuration
// Replace with your actual builder address after registering
export const BUILDER_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
export const BUILDER_FEE_RATE = 50; // 50 = 0.005% (in 1/10000th of bps)
export const MAX_BUILDER_FEE_RATE = "0.05%"; // Max fee rate for user approval

// Chain Configuration
export const ARBITRUM_CHAIN_ID = 42161;
export const HYPERLIQUID_CHAIN_ID = 999; // HyperEVM

// Hyperliquid Endpoints
export const HL_MAINNET_API = "https://api.hyperliquid.xyz";
export const HL_TESTNET_API = "https://api.hyperliquid-testnet.xyz";

// Default Trading Pairs
export const DEFAULT_COIN = "BTC";
export const POPULAR_COINS = ["BTC", "ETH", "SOL", "DOGE", "ARB", "OP", "AVAX", "LINK", "MATIC", "ATOM"];

// Asset Index Mapping (partial - add more as needed)
export const ASSET_INDEXES: Record<string, number> = {
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
};

// UI Constants
export const ORDERBOOK_DEPTH = 15;
export const TRADE_HISTORY_LIMIT = 50;
export const REFRESH_INTERVAL = 5000; // 5 seconds for non-websocket data

// Leverage limits
export const DEFAULT_LEVERAGE = 10;
export const MAX_LEVERAGE = 40;
export const MIN_LEVERAGE = 1;

// Precision
export const PRICE_DECIMALS = 2;
export const SIZE_DECIMALS = 4;
export const USD_DECIMALS = 2;
