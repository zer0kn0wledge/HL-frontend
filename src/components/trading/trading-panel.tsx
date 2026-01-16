"use client";

import { useState } from "react";
import { useUserStore } from "@/store";
import { Positions } from "./positions";
import { OpenOrders } from "./open-orders";
import { TradeHistory } from "./trade-history";
import { cn } from "@/lib/utils";
import BigNumber from "bignumber.js";

type TabType = "positions" | "orders" | "history";

export function TradingPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("positions");
  const { positionsWithTpSl, openOrders } = useUserStore();

  const activePositionsCount = positionsWithTpSl.filter(
    (p) => !new BigNumber(p.szi).isZero()
  ).length;
  const openOrdersCount = openOrders.length;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "positions", label: "Positions", count: activePositionsCount },
    { id: "orders", label: "Open Orders", count: openOrdersCount },
    { id: "history", label: "Trade History" },
  ];

  return (
    <div className="flex flex-col bg-card rounded-lg border border-border overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
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
