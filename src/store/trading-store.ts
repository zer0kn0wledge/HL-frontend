import { create } from "zustand";
import type { Position, OpenOrder, Fill, AccountState, Orderbook, MarketData } from "@/types";
import { DEFAULT_COIN, DEFAULT_LEVERAGE, ASSET_INDEXES } from "@/lib/constants";

interface TradingState {
  // Selected market
  selectedCoin: string;
  assetIndex: number;

  // Market data
  orderbook: Orderbook | null;
  midPrices: Record<string, string>;
  marketData: Record<string, MarketData>;

  // Account data
  accountState: AccountState | null;
  positions: Position[];
  openOrders: OpenOrder[];
  fills: Fill[];

  // Trading state
  leverage: number;
  isLong: boolean;

  // UI state
  isBuilderApproved: boolean;
  showBuilderApprovalModal: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedCoin: (coin: string) => void;
  setOrderbook: (orderbook: Orderbook) => void;
  setMidPrices: (prices: Record<string, string>) => void;
  setMarketData: (coin: string, data: MarketData) => void;
  setAccountState: (state: AccountState) => void;
  setPositions: (positions: Position[]) => void;
  setOpenOrders: (orders: OpenOrder[]) => void;
  setFills: (fills: Fill[]) => void;
  addFill: (fill: Fill) => void;
  setLeverage: (leverage: number) => void;
  setIsLong: (isLong: boolean) => void;
  setBuilderApproved: (approved: boolean) => void;
  setShowBuilderApprovalModal: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedCoin: DEFAULT_COIN,
  assetIndex: ASSET_INDEXES[DEFAULT_COIN] ?? 0,
  orderbook: null,
  midPrices: {},
  marketData: {},
  accountState: null,
  positions: [],
  openOrders: [],
  fills: [],
  leverage: DEFAULT_LEVERAGE,
  isLong: true,
  isBuilderApproved: false,
  showBuilderApprovalModal: false,
  isLoading: false,
  error: null,
};

export const useTradingStore = create<TradingState>((set) => ({
  ...initialState,

  setSelectedCoin: (coin) =>
    set({
      selectedCoin: coin,
      assetIndex: ASSET_INDEXES[coin] ?? 0,
      orderbook: null, // Reset orderbook when changing coin
    }),

  setOrderbook: (orderbook) => set({ orderbook }),

  setMidPrices: (prices) => set({ midPrices: prices }),

  setMarketData: (coin, data) =>
    set((state) => ({
      marketData: { ...state.marketData, [coin]: data },
    })),

  setAccountState: (accountState) =>
    set({
      accountState,
      positions: accountState.assetPositions.map((ap) => ap.position),
    }),

  setPositions: (positions) => set({ positions }),

  setOpenOrders: (orders) => set({ openOrders: orders }),

  setFills: (fills) => set({ fills }),

  addFill: (fill) =>
    set((state) => ({
      fills: [fill, ...state.fills].slice(0, 100), // Keep last 100 fills
    })),

  setLeverage: (leverage) => set({ leverage }),

  setIsLong: (isLong) => set({ isLong }),

  setBuilderApproved: (approved) => set({ isBuilderApproved: approved }),

  setShowBuilderApprovalModal: (show) => set({ showBuilderApprovalModal: show }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

// Selectors
export const selectCurrentPosition = (state: TradingState) =>
  state.positions.find((p) => p.coin === state.selectedCoin);

export const selectCurrentOrders = (state: TradingState) =>
  state.openOrders.filter((o) => o.coin === state.selectedCoin);

export const selectCurrentMidPrice = (state: TradingState) =>
  state.midPrices[state.selectedCoin] || "0";

export const selectAccountValue = (state: TradingState) =>
  state.accountState?.marginSummary.accountValue || "0";

export const selectWithdrawable = (state: TradingState) =>
  state.accountState?.marginSummary.withdrawable || "0";
