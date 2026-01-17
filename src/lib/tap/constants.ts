// ============================================
// TAP TRADING CONSTANTS
// ============================================

// Grid configuration
export const GRID_CONFIG = {
  rows: 10,                   // 5 above price, 5 below
  cols: 6,                    // 6 time columns
  timeWindows: [15, 30, 60, 120, 300, 600], // seconds
};

// Price increments by asset
export const PRICE_INCREMENTS: Record<string, number> = {
  BTC: 50,
  ETH: 5,
  SOL: 0.5,
  DEFAULT: 0.1,
};

// Bet amount presets
export const BET_PRESETS = [5, 10, 25, 50, 100];
export const DEFAULT_BET_AMOUNT = 10;

// Multiplier bounds
export const MIN_MULTIPLIER = 1.1;
export const MAX_MULTIPLIER = 20;

// Animation durations (ms)
export const ANIMATION_DURATION = {
  betPlace: 200,
  winCelebration: 2500,
  priceUpdate: 100,
};

// Colors
export const COLORS = {
  primary: '#50E3C2',
  primaryGlow: 'rgba(80, 227, 194, 0.5)',
  long: '#22C55E',
  longGlow: 'rgba(34, 197, 94, 0.5)',
  short: '#EF4444',
  shortGlow: 'rgba(239, 68, 68, 0.5)',
  win: '#FACC15',
  winGlow: 'rgba(250, 204, 21, 0.5)',
  background: '#000000',
  card: '#030712',
  border: 'rgba(255, 255, 255, 0.1)',
};

// Time window labels
export const TIME_LABELS: Record<number, string> = {
  15: '15s',
  30: '30s',
  60: '1m',
  120: '2m',
  300: '5m',
  600: '10m',
};
