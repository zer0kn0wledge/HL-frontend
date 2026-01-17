// ============================================
// TAP TRADING TYPE DEFINITIONS
// ============================================

export type BetDirection = 'long' | 'short';
export type BetStatus = 'pending' | 'active' | 'won' | 'lost' | 'cancelled';

export interface TapBet {
  id: string;
  asset: string;
  direction: BetDirection;
  stake: number;              // USD amount bet
  targetPrice: number;        // Price that needs to be hit
  entryPrice: number;         // Price when bet was placed
  multiplier: number;         // Payout multiplier
  expiresAt: number;          // Timestamp when bet expires
  placedAt: number;           // Timestamp when bet was placed
  status: BetStatus;
  orderId?: string;           // Hyperliquid order ID
  pnl?: number;               // Realized PnL (after win/loss)
}

export interface GridBox {
  id: string;
  row: number;
  col: number;
  price: number;
  timeWindow: number;         // Seconds until expiry
  multiplier: number;
  direction: BetDirection;
}

export interface PricePoint {
  time: number;
  price: number;
}

export interface TapTradingState {
  asset: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  betAmount: number;
  activeBets: TapBet[];
  completedBets: TapBet[];
  balance: number;
  sessionPnL: number;
  isConnected: boolean;
}

export interface GridConfig {
  rows: number;               // Total rows (half above, half below price)
  cols: number;               // Number of time columns
  priceIncrement: number;     // Price step per row
  timeWindows: number[];      // Time windows for each column (seconds)
}

export type TapTradingAction =
  | { type: 'SET_ASSET'; payload: string }
  | { type: 'SET_PRICE'; payload: number }
  | { type: 'ADD_PRICE_HISTORY'; payload: PricePoint }
  | { type: 'SET_BET_AMOUNT'; payload: number }
  | { type: 'PLACE_BET'; payload: TapBet }
  | { type: 'UPDATE_BET'; payload: { id: string; updates: Partial<TapBet> } }
  | { type: 'BET_WON'; payload: { id: string; pnl: number } }
  | { type: 'BET_LOST'; payload: string }
  | { type: 'SET_BALANCE'; payload: number }
  | { type: 'SET_CONNECTED'; payload: boolean };
