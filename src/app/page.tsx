"use client";

import { Header } from "@/components/trading/header";
import { Orderbook } from "@/components/trading/orderbook";
import { OrderForm } from "@/components/trading/order-form";
import { AccountInfo } from "@/components/trading/account-info";
import { TradingPanel } from "@/components/trading/trading-panel";
import { BuilderApprovalModal } from "@/components/trading/builder-approval-modal";
import { DataProvider } from "@/components/trading/data-provider";

export default function TradingPage() {
  return (
    <DataProvider>
      <div className="flex h-screen flex-col bg-zinc-950">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Orderbook */}
          <div className="hidden w-80 flex-shrink-0 border-r border-zinc-800 lg:block">
            <Orderbook />
          </div>

          {/* Center Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Account Info Bar */}
            <div className="border-b border-zinc-800 p-4">
              <AccountInfo />
            </div>

            {/* Main Trading Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Chart Area (placeholder) */}
              <div className="flex-1 overflow-hidden border-r border-zinc-800">
                <div className="flex h-full flex-col">
                  {/* Chart placeholder */}
                  <div className="flex flex-1 items-center justify-center bg-zinc-900/50">
                    <div className="text-center">
                      <div className="mb-2 text-4xl">📈</div>
                      <p className="text-sm text-zinc-500">
                        TradingView chart integration
                      </p>
                      <p className="text-xs text-zinc-600">Coming soon</p>
                    </div>
                  </div>

                  {/* Mobile Orderbook */}
                  <div className="h-64 border-t border-zinc-800 lg:hidden">
                    <Orderbook />
                  </div>
                </div>
              </div>

              {/* Right Panel - Order Form */}
              <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900">
                <OrderForm />
              </div>
            </div>

            {/* Bottom Panel - Positions/Orders/History */}
            <div className="h-72 flex-shrink-0 overflow-hidden border-t border-zinc-800">
              <TradingPanel />
            </div>
          </div>
        </div>

        {/* Modals */}
        <BuilderApprovalModal />
      </div>
    </DataProvider>
  );
}
