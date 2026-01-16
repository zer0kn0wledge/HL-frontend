// ============================================
// User Store - Account Data and Positions
// ============================================

import { create } from "zustand";
import type {
  AccountState,
  Position,
  PositionWithTpSl,
  OpenOrder,
  Fill,
  SpotBalance,
  TradeFormState,
  OrderType,
  OrderSide,
  TimeInForce,
} from "@/types";
import { TRADING, TWAP, SCALED } from "@/lib/constants";
import BigNumber from "bignumber.js";

interface UserState {
  // Account
  address: string | null;
  accountState: AccountState | null;

  // Spot balances
  spotBalances: SpotBalance[];

  // Perp positions
  positions: Position[];
  positionsWithTpSl: PositionWithTpSl[];

  // Orders
  openOrders: OpenOrder[];
  orderHistory: OpenOrder[];

  // Fills/trades
  fills: Fill[];

  // Trade form state
  tradeForm: TradeFormState;

  // Current leverage for selected market
  currentLeverage: number;
  marginMode: "cross" | "isolated";

  // Actions
  setAddress: (address: string | null) => void;
  setAccountState: (state: AccountState | null) => void;
  setSpotBalances: (balances: SpotBalance[]) => void;
  setPositions: (positions: Position[]) => void;
  setOpenOrders: (orders: OpenOrder[]) => void;
  setOrderHistory: (orders: OpenOrder[]) => void;
  setFills: (fills: Fill[]) => void;
  addFill: (fill: Fill) => void;

  // Trade form actions
  setOrderType: (type: OrderType) => void;
  setSide: (side: OrderSide) => void;
  setSize: (size: string) => void;
  setPrice: (price: string) => void;
  setTriggerPrice: (price: string) => void;
  setReduceOnly: (reduceOnly: boolean) => void;
  setPostOnly: (postOnly: boolean) => void;
  setTif: (tif: TimeInForce) => void;
  setLeverage: (leverage: number) => void;
  setMarginMode: (mode: "cross" | "isolated") => void;
  setTwapDuration: (minutes: number) => void;
  setTwapRandomize: (randomize: boolean) => void;
  setScaledOrders: (count: number) => void;
  setScaledStartPrice: (price: string) => void;
  setScaledEndPrice: (price: string) => void;
  setTakeProfitPrice: (price: string) => void;
  setStopLossPrice: (price: string) => void;
  resetTradeForm: () => void;

  // Leverage
  setCurrentLeverage: (leverage: number) => void;

  reset: () => void;
}

const initialTradeForm: TradeFormState = {
  orderType: "limit",
  side: "buy",
  size: "",
  price: "",
  triggerPrice: "",
  reduceOnly: false,
  postOnly: false,
  tif: TRADING.DEFAULT_TIF,
  leverage: TRADING.DEFAULT_LEVERAGE,
  marginMode: TRADING.DEFAULT_MARGIN_MODE,
  twapDuration: TWAP.DEFAULT_DURATION,
  twapRandomize: true,
  scaledOrders: SCALED.DEFAULT_ORDERS,
  scaledStartPrice: "",
  scaledEndPrice: "",
  takeProfitPrice: "",
  stopLossPrice: "",
};

const initialState = {
  address: null,
  accountState: null,
  spotBalances: [],
  positions: [],
  positionsWithTpSl: [],
  openOrders: [],
  orderHistory: [],
  fills: [],
  tradeForm: initialTradeForm,
  currentLeverage: TRADING.DEFAULT_LEVERAGE,
  marginMode: TRADING.DEFAULT_MARGIN_MODE as "cross" | "isolated",
};

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,

  setAddress: (address) => set({ address }),

  setAccountState: (accountState) => {
    const positions = accountState?.assetPositions
      .map((ap) => ap.position)
      .filter((p) => new BigNumber(p.szi).abs().gt(0)) || [];
    set({ accountState, positions });
  },

  setSpotBalances: (spotBalances) => set({ spotBalances }),

  setPositions: (positions) => {
    // Merge with open orders to create positionsWithTpSl
    const { openOrders } = get();
    const positionsWithTpSl = positions.map((pos) => {
      const tpOrders = openOrders.filter(
        (o) => o.coin === pos.coin && o.tpsl === "tp"
      );
      const slOrders = openOrders.filter(
        (o) => o.coin === pos.coin && o.tpsl === "sl"
      );
      return { ...pos, tpOrders, slOrders };
    });
    set({ positions, positionsWithTpSl });
  },

  setOpenOrders: (openOrders) => {
    // Update positionsWithTpSl when orders change
    const { positions } = get();
    const positionsWithTpSl = positions.map((pos) => {
      const tpOrders = openOrders.filter(
        (o) => o.coin === pos.coin && o.tpsl === "tp"
      );
      const slOrders = openOrders.filter(
        (o) => o.coin === pos.coin && o.tpsl === "sl"
      );
      return { ...pos, tpOrders, slOrders };
    });
    set({ openOrders, positionsWithTpSl });
  },

  setOrderHistory: (orderHistory) => set({ orderHistory }),

  setFills: (fills) => set({ fills }),

  addFill: (fill) =>
    set((state) => ({
      fills: [fill, ...state.fills].slice(0, 100),
    })),

  // Trade form actions
  setOrderType: (orderType) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, orderType } })),

  setSide: (side) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, side } })),

  setSize: (size) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, size } })),

  setPrice: (price) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, price } })),

  setTriggerPrice: (triggerPrice) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, triggerPrice } })),

  setReduceOnly: (reduceOnly) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, reduceOnly } })),

  setPostOnly: (postOnly) =>
    set((state) => ({
      tradeForm: {
        ...state.tradeForm,
        postOnly,
        tif: postOnly ? "Alo" : state.tradeForm.tif,
      },
    })),

  setTif: (tif) =>
    set((state) => ({
      tradeForm: { ...state.tradeForm, tif, postOnly: tif === "Alo" },
    })),

  setLeverage: (leverage) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, leverage } })),

  setMarginMode: (marginMode) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, marginMode }, marginMode })),

  setTwapDuration: (twapDuration) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, twapDuration } })),

  setTwapRandomize: (twapRandomize) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, twapRandomize } })),

  setScaledOrders: (scaledOrders) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, scaledOrders } })),

  setScaledStartPrice: (scaledStartPrice) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, scaledStartPrice } })),

  setScaledEndPrice: (scaledEndPrice) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, scaledEndPrice } })),

  setTakeProfitPrice: (takeProfitPrice) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, takeProfitPrice } })),

  setStopLossPrice: (stopLossPrice) =>
    set((state) => ({ tradeForm: { ...state.tradeForm, stopLossPrice } })),

  resetTradeForm: () =>
    set((state) => ({ tradeForm: { ...initialTradeForm, leverage: state.currentLeverage } })),

  setCurrentLeverage: (currentLeverage) => set({ currentLeverage }),

  reset: () => set(initialState),
}));

// Selectors
export const selectAccountValue = (state: UserState) =>
  state.accountState?.marginSummary.accountValue || "0";

export const selectWithdrawable = (state: UserState) =>
  state.accountState?.marginSummary.withdrawable || "0";

export const selectTotalMarginUsed = (state: UserState) =>
  state.accountState?.marginSummary.totalMarginUsed || "0";

export const selectPosition = (state: UserState, coin: string) =>
  state.positions.find((p) => p.coin === coin);

export const selectPositionWithTpSl = (state: UserState, coin: string) =>
  state.positionsWithTpSl.find((p) => p.coin === coin);

export const selectOrdersForCoin = (state: UserState, coin: string) =>
  state.openOrders.filter((o) => o.coin === coin);

export const selectFillsForCoin = (state: UserState, coin: string) =>
  state.fills.filter((f) => f.coin === coin);

export const selectTotalPnl = (state: UserState) => {
  return state.positions.reduce((acc, pos) => {
    return acc.plus(pos.unrealizedPnl);
  }, new BigNumber(0)).toString();
};

export const selectSpotBalance = (state: UserState, coin: string) =>
  state.spotBalances.find((b) => b.coin === coin);

export const selectAvailableBalance = (state: UserState) => {
  const accountValue = new BigNumber(selectAccountValue(state));
  const marginUsed = new BigNumber(selectTotalMarginUsed(state));
  return accountValue.minus(marginUsed).toString();
};
