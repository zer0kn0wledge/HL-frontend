"use client";

import { useState } from "react";
import { useTradingStore } from "@/store/trading-store";
import { Positions } from "./positions";
import { OpenOrders } from "./open-orders";
import { TradeHistory } from "./trade-history";
import { cn } from "@/lib/utils";

type TabType = "positions" | "orders" | "history";

export function TradingPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("positions");
  const positions = useTradingStore((s) => s.positions);
  const openOrders = useTradingStore((s) => s.openOrders);

  const activePositionsCount = positions.filter((p) => parseFloat(p.szi) !== 0).length;
  const openOrdersCount = openOrders.length;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "positions", label: "Positions", count: activePositionsCount },
    { id: "orders", label: "Open Orders", count: openOrdersCount },
    { id: "history", label: "Trade History" },
  ];

  return (
    <div className="flex flex-col">
      {/* Tab Headers */}
      <div className="flex border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-green-500 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === "positions" && <Positions />}
        {activeTab === "orders" && <OpenOrders />}
        {activeTab === "history" && <TradeHistory />}
      </div>
    </div>
  );
}
