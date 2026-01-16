// ============================================
// Settings Store - User Preferences (Persisted)
// ============================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserSettings, TimeInForce } from "@/types";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "@/lib/constants";

interface SettingsState extends UserSettings {
  // Actions
  setTheme: (theme: "dark" | "light") => void;
  setOrderbookGrouping: (grouping: number) => void;
  setDefaultLeverage: (leverage: number) => void;
  setDefaultMarginMode: (mode: "cross" | "isolated") => void;
  setConfirmOrders: (confirm: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setShowPnlPercent: (show: boolean) => void;
  addFavoriteMarket: (coin: string) => void;
  removeFavoriteMarket: (coin: string) => void;
  setDefaultTif: (tif: TimeInForce) => void;
  setSlippage: (slippage: string) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),

      setOrderbookGrouping: (orderbookGrouping) => set({ orderbookGrouping }),

      setDefaultLeverage: (defaultLeverage) => set({ defaultLeverage }),

      setDefaultMarginMode: (defaultMarginMode) => set({ defaultMarginMode }),

      setConfirmOrders: (confirmOrders) => set({ confirmOrders }),

      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

      setShowPnlPercent: (showPnlPercent) => set({ showPnlPercent }),

      addFavoriteMarket: (coin) =>
        set((state) => ({
          favoriteMarkets: state.favoriteMarkets.includes(coin)
            ? state.favoriteMarkets
            : [...state.favoriteMarkets, coin],
        })),

      removeFavoriteMarket: (coin) =>
        set((state) => ({
          favoriteMarkets: state.favoriteMarkets.filter((c) => c !== coin),
        })),

      setDefaultTif: (defaultTif) => set({ defaultTif }),

      setSlippage: (slippage) => set({ slippage }),

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        orderbookGrouping: state.orderbookGrouping,
        defaultLeverage: state.defaultLeverage,
        defaultMarginMode: state.defaultMarginMode,
        confirmOrders: state.confirmOrders,
        soundEnabled: state.soundEnabled,
        showPnlPercent: state.showPnlPercent,
        favoriteMarkets: state.favoriteMarkets,
        defaultTif: state.defaultTif,
        slippage: state.slippage,
      }),
    }
  )
);

// Selectors
export const selectIsDarkMode = (state: SettingsState) => state.theme === "dark";

export const selectIsFavorite = (state: SettingsState, coin: string) =>
  state.favoriteMarkets.includes(coin);
