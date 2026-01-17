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
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { XPBarCompact } from "@/components/gamification/xp-bar";
import { HypurrLoader } from "@/components/brand/hypurr-logo";
import { useAppStore, useUserStore } from "@/store";
import Link from "next/link";
import {
  Trophy,
  Flame,
  MessageSquare,
  BarChart3,
  User,
  TrendingUp,
  Wallet,
} from "lucide-react";
import BigNumber from "bignumber.js";

// ============================================
// Analytics Dashboard Panel
// ============================================

import { useMarketStore } from "@/store";
import { useMemo } from "react";

function AnalyticsDashboard() {
  const { accountState } = useUserStore();
  const { currentCoin } = useAppStore();
  const { marketStats, perpMarkets } = useMarketStore();

  const currentStats = marketStats[currentCoin];

  const accountValue = accountState?.marginSummary?.accountValue || "0";
  const marginUsed = accountState?.marginSummary?.totalMarginUsed || "0";
  const withdrawable = accountState?.marginSummary?.withdrawable || "0";
  const totalPnl = accountState?.marginSummary?.totalRawUsd || "0";
  const positions = accountState?.assetPositions || [];

  // Calculate 24h change
  const change24h = useMemo(() => {
    if (!currentStats?.midPx || !currentStats?.prevDayPx) return 0;
    const current = new BigNumber(currentStats.midPx);
    const prev = new BigNumber(currentStats.prevDayPx);
    if (prev.isZero()) return 0;
    return current.minus(prev).dividedBy(prev).times(100).toNumber();
  }, [currentStats]);

  // Top gainers
  const topMovers = useMemo(() => {
    return perpMarkets
      .map(m => {
        const stats = marketStats[m.coin];
        if (!stats?.midPx || !stats?.prevDayPx) return null;
        const current = new BigNumber(stats.midPx);
        const prev = new BigNumber(stats.prevDayPx);
        if (prev.isZero()) return null;
        const change = current.minus(prev).dividedBy(prev).times(100).toNumber();
        return { coin: m.coin, change, price: stats.midPx };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b!.change) - Math.abs(a!.change))
      .slice(0, 4);
  }, [perpMarkets, marketStats]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Portfolio Section */}
      <div className="p-2 border-b border-white/5">
        <div className="text-[9px] uppercase text-gray-500 font-medium tracking-wider mb-2">
          Portfolio
        </div>
        <div className="space-y-1">
          <StatRow icon={<Wallet className="w-3 h-3" />} label="Value" value={`$${new BigNumber(accountValue).toFormat(2)}`} />
          <StatRow icon={<BarChart3 className="w-3 h-3" />} label="Margin" value={`$${new BigNumber(marginUsed).toFormat(2)}`} />
          <StatRow
            icon={<TrendingUp className="w-3 h-3" />}
            label="uPnL"
            value={`$${new BigNumber(totalPnl).toFormat(2)}`}
            valueColor={new BigNumber(totalPnl).gte(0) ? "text-green-400" : "text-red-400"}
          />
          <StatRow icon={<Wallet className="w-3 h-3" />} label="Free" value={`$${new BigNumber(withdrawable).toFormat(2)}`} />
        </div>
      </div>

      {/* Current Market Stats */}
      <div className="p-2 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase text-gray-500 font-medium tracking-wider">{currentCoin}</span>
          <span className={`text-[10px] font-mono ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>
        <div className="space-y-1">
          {currentStats && (
            <>
              <MiniStat label="Mark" value={`$${new BigNumber(currentStats.markPx || 0).toFormat(2)}`} />
              <MiniStat label="Index" value={`$${new BigNumber(currentStats.oraclePx || 0).toFormat(2)}`} />
              <MiniStat label="24h Vol" value={`$${new BigNumber(currentStats.dayNtlVlm || 0).dividedBy(1e6).toFormat(2)}M`} />
              <MiniStat label="OI" value={`$${new BigNumber(currentStats.openInterest || 0).dividedBy(1e6).toFormat(2)}M`} />
              <MiniStat
                label="Funding"
                value={`${new BigNumber(currentStats.funding || 0).times(100).toFixed(4)}%`}
                valueColor={new BigNumber(currentStats.funding || 0).gte(0) ? 'text-green-400' : 'text-red-400'}
              />
            </>
          )}
        </div>
      </div>

      {/* Top Movers */}
      <div className="p-2 border-b border-white/5">
        <div className="text-[9px] uppercase text-gray-500 font-medium tracking-wider mb-2">
          Top Movers
        </div>
        <div className="space-y-1">
          {topMovers.map((m, i) => m && (
            <div key={m.coin} className="flex items-center justify-between text-[10px]">
              <span className="text-gray-400 font-mono">{m.coin}</span>
              <span className={`font-mono ${m.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Positions Summary */}
      {positions.length > 0 && (
        <div className="p-2">
          <div className="text-[9px] uppercase text-gray-500 font-medium tracking-wider mb-2">
            Positions ({positions.length})
          </div>
          <div className="space-y-1">
            {positions.slice(0, 4).map(({ position }) => (
              <div key={position.coin} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400 font-mono">{position.coin}</span>
                <span className={`font-mono ${new BigNumber(position.unrealizedPnl).gte(0) ? 'text-green-400' : 'text-red-400'}`}>
                  ${new BigNumber(position.unrealizedPnl).toFormat(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  valueColor = "text-white"
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-[9px]">{label}</span>
      </div>
      <span className={`text-[10px] font-mono font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, valueColor = "text-white" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-gray-500">{label}</span>
      <span className={`text-[10px] font-mono ${valueColor}`}>{value}</span>
    </div>
  );
}

// ============================================
// Navigation Sidebar with Analytics
// ============================================

function NavSidebar() {
  return (
    <div className="hidden lg:flex flex-col w-14 glass border-r border-white/5">
      <div className="flex flex-col gap-0.5 py-2">
        <NavItem href="/profile" icon={<User className="h-4 w-4" />} label="Profile" />
        <NavItem href="/feed" icon={<MessageSquare className="h-4 w-4" />} label="Social Feed" />
        <NavItem href="/achievements" icon={<Trophy className="h-4 w-4" />} label="Achievements" />
        <NavItem href="/challenges" icon={<Flame className="h-4 w-4" />} label="Challenges" />
      </div>
      <div className="flex-1" />
      <div className="py-2 px-1">
        <XPBarCompact />
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center p-2 mx-1 rounded-lg hover:bg-[#50E3C2]/10 transition-all duration-200 group relative"
      title={label}
    >
      <span className="text-gray-500 group-hover:text-[#50E3C2] transition-colors">
        {icon}
      </span>
      <span className="absolute left-full ml-2 px-2 py-1 glass text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-white/10">
        {label}
      </span>
    </Link>
  );
}

// ============================================
// Bottom Panel with Tabs (Compact)
// ============================================

function BottomPanel() {
  return (
    <Tabs defaultValue="positions" className="flex flex-col h-full">
      <div className="flex items-center px-2 py-1 border-b border-white/5">
        <TabsList className="h-7 bg-transparent gap-0.5">
          <TabsTrigger value="positions" className="text-[10px] h-6 px-2 data-[state=active]:bg-[#50E3C2]/10 data-[state=active]:text-[#50E3C2]">
            Positions
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-[10px] h-6 px-2 data-[state=active]:bg-[#50E3C2]/10 data-[state=active]:text-[#50E3C2]">
            Open Orders
          </TabsTrigger>
          <TabsTrigger value="trades" className="text-[10px] h-6 px-2 data-[state=active]:bg-[#50E3C2]/10 data-[state=active]:text-[#50E3C2]">
            Trade History
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <TabsContent value="positions" className="h-full m-0">
          <Positions />
        </TabsContent>
        <TabsContent value="orders" className="h-full m-0">
          <OpenOrders />
        </TabsContent>
        <TabsContent value="trades" className="h-full m-0">
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-gray-500">No trade history</p>
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

        {/* Analytics Dashboard Panel - Left */}
        <div className="hidden xl:flex flex-col w-44 glass border-r border-white/5 flex-shrink-0">
          <AnalyticsDashboard />
        </div>

        <div className="flex flex-1 overflow-hidden p-1.5 gap-1.5">
          {/* Main Center Area */}
          <div className="flex flex-1 flex-col gap-1.5 min-w-0">
            {/* Top Section - Chart + Trade Panel */}
            <div className="flex flex-1 gap-1.5 min-h-0">
              {/* Chart Area - Takes most space */}
              <div className="flex-1 min-w-0">
                <Chart className="h-full" />
              </div>

              {/* Trade Panel - Right of chart */}
              <div className="hidden md:block w-64 flex-shrink-0">
                <TradePanel />
              </div>
            </div>

            {/* Mobile Trade Panel */}
            <div className="md:hidden">
              <TradePanel />
            </div>

            {/* Bottom Panel - Positions/Orders/History */}
            <div className="h-48 flex-shrink-0 glass rounded-lg border border-white/5">
              <BottomPanel />
            </div>
          </div>

          {/* Right Side - Orderbook + Recent Trades */}
          <div className="hidden lg:flex flex-col w-[280px] gap-1.5 flex-shrink-0">
            {/* Orderbook - Upper portion */}
            <div className="flex-1 min-h-0">
              <Orderbook />
            </div>

            {/* Recent Trades - Lower portion */}
            <div className="h-56 flex-shrink-0">
              <RecentTrades />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Orderbook */}
      <div className="lg:hidden border-t border-white/5 h-64">
        <Orderbook />
      </div>

      {/* Command Palette */}
      <CommandPalette />

      {/* Modals */}
      <BuilderApprovalModal />
      <SettingsDialog />

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50">
          <HypurrLoader text="Loading Zero's Hypurr Terminal..." />
        </div>
      )}
    </div>
  );
}
