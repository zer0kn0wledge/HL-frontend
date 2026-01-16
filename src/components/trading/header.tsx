"use client";

import { ConnectButton } from "@/components/wallet/connect-button";
import { MarketSelector } from "./market-selector";
import { useTradingStore } from "@/store/trading-store";
import { formatPrice, formatPercent } from "@/lib/utils";

export function Header() {
  const selectedCoin = useTradingStore((s) => s.selectedCoin);
  const midPrices = useTradingStore((s) => s.midPrices);

  const currentPrice = midPrices[selectedCoin] || "0";

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600" />
          <span className="text-lg font-bold text-white">HL Trader</span>
        </div>

        {/* Market Selector */}
        <MarketSelector />

        {/* Price Info */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-zinc-500">Mark Price</div>
            <div className="text-lg font-semibold text-white">
              ${formatPrice(currentPrice)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Network indicator */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-zinc-400">Hyperliquid Mainnet</span>
        </div>

        {/* Wallet */}
        <ConnectButton />
      </div>
    </header>
  );
}
