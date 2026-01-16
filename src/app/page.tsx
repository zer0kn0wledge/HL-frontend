"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Header } from "@/components/trading/header";
import { Orderbook } from "@/components/trading/orderbook";
import { TradePanel } from "@/components/trading/trade-panel";
import { Positions } from "@/components/trading/positions";
import { OpenOrders } from "@/components/trading/open-orders";
import { RecentTrades } from "@/components/trading/recent-trades";
import { BuilderApprovalModal } from "@/components/trading/builder-approval-modal";
import { Chart } from "@/components/trading/chart";
import { CommandPalette, useKeyboardShortcuts } from "@/components/ui/command-palette";
import { XPBarCompact } from "@/components/gamification/xp-bar";
import { useAppStore } from "@/store";
import Link from "next/link";
import {
  Trophy,
  Users,
  BarChart3,
  Flame,
  MessageSquare,
} from "lucide-react";

// ============================================
// Navigation Sidebar
// ============================================

function NavSidebar() {
  return (
    <div className="hidden lg:flex flex-col w-12 bg-card border-r border-border py-2 gap-1">
      <NavItem href="/feed" icon={<MessageSquare className="h-5 w-5" />} label="Feed" />
      <NavItem href="/achievements" icon={<Trophy className="h-5 w-5" />} label="Achievements" />
      <NavItem href="/challenges" icon={<Flame className="h-5 w-5" />} label="Challenges" />
      <div className="flex-1" />
      <div className="px-2">
        <XPBarCompact />
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center p-2 mx-1 rounded-lg hover:bg-muted transition-colors group relative"
      title={label}
    >
      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
      </span>
      <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        {label}
      </span>
    </Link>
  );
}

// ============================================
// Bottom Panel with Tabs
// ============================================

function BottomPanel() {
  return (
    <Tabs defaultValue="positions" className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50">
        <TabsList className="h-8">
          <TabsTrigger value="positions" className="text-xs h-7 px-3">
            Positions
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs h-7 px-3">
            Open Orders
          </TabsTrigger>
          <TabsTrigger value="trades" className="text-xs h-7 px-3">
            Trade History
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="flex-1 min-h-0">
        <TabsContent value="positions" className="h-full m-0">
          <Positions />
        </TabsContent>
        <TabsContent value="orders" className="h-full m-0">
          <OpenOrders />
        </TabsContent>
        <TabsContent value="trades" className="h-full m-0">
          <div className="flex flex-col h-full bg-card rounded-lg border border-border">
            <div className="px-3 py-2 border-b border-border">
              <h3 className="text-sm font-medium">Trade History</h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No trade history</p>
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}

// ============================================
// Main Trading Page
// ============================================

export default function TradingPage() {
  const { isInitializing } = useAppStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Nav Sidebar */}
        <NavSidebar />

        <div className="flex flex-1 overflow-hidden p-2 gap-2">
          {/* Left Panel - Orderbook */}
          <div className="hidden lg:flex w-72 flex-shrink-0">
            <Orderbook />
          </div>

          {/* Center Content */}
          <div className="flex flex-1 flex-col gap-2 min-w-0">
            {/* Top Row - Chart */}
            <div className="flex flex-1 gap-2 min-h-0">
              {/* Chart Area */}
              <Chart className="flex-1" />

              {/* Right - Trade Panel */}
              <div className="hidden md:block w-72 flex-shrink-0">
                <TradePanel />
              </div>
            </div>

            {/* Mobile Orderbook */}
            <div className="h-64 lg:hidden">
              <Orderbook />
            </div>

            {/* Mobile Trade Panel */}
            <div className="md:hidden">
              <TradePanel />
            </div>

            {/* Bottom Panel - Positions/Orders/History */}
            <div className="h-64 flex-shrink-0 hidden sm:block">
              <BottomPanel />
            </div>
          </div>

          {/* Right Panel - Recent Trades */}
          <div className="hidden xl:flex w-64 flex-shrink-0">
            <RecentTrades />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab (simplified for mobile) */}
      <div className="sm:hidden border-t border-border">
        <BottomPanel />
      </div>

      {/* Command Palette */}
      <CommandPalette />

      {/* Modals */}
      <BuilderApprovalModal />

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading markets...</p>
          </div>
        </div>
      )}
    </div>
  );
}
