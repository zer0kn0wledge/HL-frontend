// ============================================
// App Store - Global Application State
// ============================================

import { create } from "zustand";
import type { NotificationMessage, MarketType } from "@/types";

interface AppState {
  // Connection state
  isConnected: boolean;
  isWsConnected: boolean;

  // UI state
  isMobileMenuOpen: boolean;
  isMarketSelectorOpen: boolean;
  isSettingsOpen: boolean;
  activeModal: string | null;

  // Current market
  currentMarketType: MarketType;
  currentCoin: string;

  // Notifications
  notifications: NotificationMessage[];

  // Loading states
  isInitializing: boolean;
  isLoadingMarkets: boolean;

  // Builder approval
  isBuilderApproved: boolean;
  showBuilderApprovalModal: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setWsConnected: (connected: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setMarketSelectorOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  setCurrentMarket: (type: MarketType, coin: string) => void;
  addNotification: (notification: Omit<NotificationMessage, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setInitializing: (initializing: boolean) => void;
  setLoadingMarkets: (loading: boolean) => void;
  setBuilderApproved: (approved: boolean) => void;
  setShowBuilderApprovalModal: (show: boolean) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  isWsConnected: false,
  isMobileMenuOpen: false,
  isMarketSelectorOpen: false,
  isSettingsOpen: false,
  activeModal: null,
  currentMarketType: "perp" as MarketType,
  currentCoin: "BTC",
  notifications: [],
  isInitializing: true,
  isLoadingMarkets: false,
  isBuilderApproved: false,
  showBuilderApprovalModal: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setConnected: (isConnected) => set({ isConnected }),

  setWsConnected: (isWsConnected) => set({ isWsConnected }),

  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),

  setMarketSelectorOpen: (isMarketSelectorOpen) => set({ isMarketSelectorOpen }),

  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),

  setActiveModal: (activeModal) => set({ activeModal }),

  setCurrentMarket: (type, coin) =>
    set({
      currentMarketType: type,
      currentCoin: coin,
      isMarketSelectorOpen: false,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ].slice(-10), // Keep max 10 notifications
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),

  setInitializing: (isInitializing) => set({ isInitializing }),

  setLoadingMarkets: (isLoadingMarkets) => set({ isLoadingMarkets }),

  setBuilderApproved: (isBuilderApproved) => set({ isBuilderApproved }),

  setShowBuilderApprovalModal: (showBuilderApprovalModal) =>
    set({ showBuilderApprovalModal }),

  reset: () => set(initialState),
}));

// Selectors
export const selectIsReady = (state: AppState) =>
  !state.isInitializing && state.isConnected;

export const selectCurrentMarketKey = (state: AppState) =>
  `${state.currentMarketType}:${state.currentCoin}`;
