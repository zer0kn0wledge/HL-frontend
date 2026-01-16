"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTradingStore } from "@/store/trading-store";
import { POPULAR_COINS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MarketSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCoin = useTradingStore((s) => s.selectedCoin);
  const setSelectedCoin = useTradingStore((s) => s.setSelectedCoin);
  const midPrices = useTradingStore((s) => s.midPrices);

  const filteredCoins = POPULAR_COINS.filter((coin) =>
    coin.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (coin: string) => {
    setSelectedCoin(coin);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-zinc-600"
      >
        <span className="text-base font-semibold">{selectedCoin}-PERP</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
            {/* Search */}
            <div className="border-b border-zinc-700 p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Market List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredCoins.map((coin) => {
                const price = midPrices[coin] || "0";
                const isSelected = coin === selectedCoin;

                return (
                  <button
                    key={coin}
                    onClick={() => handleSelect(coin)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-3 transition-colors",
                      isSelected
                        ? "bg-zinc-800"
                        : "hover:bg-zinc-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-white">
                        {coin.slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-white">
                          {coin}-PERP
                        </div>
                        <div className="text-xs text-zinc-500">Perpetual</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">
                        ${formatPrice(price)}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredCoins.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No markets found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
