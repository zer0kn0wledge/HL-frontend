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
// Analytics Dashboard Panel - Expanded
// ============================================

import { useMarketStore } from "@/store";
import { useMemo, useState } from "react";
import { TrendingDown, Activity, DollarSign, Percent, Clock, ChevronRight, Target, Zap, PieChart } from "lucide-react";

function AnalyticsDashboard() {
  const { accountState, fills, positions } = useUserStore();
  const { currentCoin } = useAppStore();
  const { marketStats, perpMarkets } = useMarketStore();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'market' | 'activity'>('portfolio');

  const currentStats = marketStats[currentCoin];

  const accountValue = accountState?.marginSummary?.accountValue || "0";
  const marginUsed = accountState?.marginSummary?.totalMarginUsed || "0";
  const withdrawable = accountState?.marginSummary?.withdrawable || "0";
  const totalPnl = accountState?.marginSummary?.totalRawUsd || "0";
  const totalNtlPos = accountState?.marginSummary?.totalNtlPos || "0";
  const positionList = accountState?.assetPositions || [];

  // Calculate metrics
  const marginUtilization = useMemo(() => {
    const value = new BigNumber(accountValue);
    const margin = new BigNumber(marginUsed);
    if (value.isZero()) return 0;
    return margin.dividedBy(value).times(100).toNumber();
  }, [accountValue, marginUsed]);

  const leverageUsed = useMemo(() => {
    const value = new BigNumber(accountValue);
    const ntl = new BigNumber(totalNtlPos);
    if (value.isZero()) return 0;
    return ntl.dividedBy(value).toNumber();
  }, [accountValue, totalNtlPos]);

  // Calculate 24h change
  const change24h = useMemo(() => {
    if (!currentStats?.midPx || !currentStats?.prevDayPx) return 0;
    const current = new BigNumber(currentStats.midPx);
    const prev = new BigNumber(currentStats.prevDayPx);
    if (prev.isZero()) return 0;
    return current.minus(prev).dividedBy(prev).times(100).toNumber();
  }, [currentStats]);

  // Top gainers and losers
  const { topGainers, topLosers } = useMemo(() => {
    const sorted = perpMarkets
      .map(m => {
        const stats = marketStats[m.coin];
        if (!stats?.midPx || !stats?.prevDayPx) return null;
        const current = new BigNumber(stats.midPx);
        const prev = new BigNumber(stats.prevDayPx);
        if (prev.isZero()) return null;
        const change = current.minus(prev).dividedBy(prev).times(100).toNumber();
        return { coin: m.coin, change, price: stats.midPx, volume: stats.dayNtlVlm };
      })
      .filter(Boolean)
      .sort((a, b) => b!.change - a!.change);

    return {
      topGainers: sorted.slice(0, 3),
      topLosers: sorted.slice(-3).reverse(),
    };
  }, [perpMarkets, marketStats]);

  // Recent trading activity
  const recentActivity = useMemo(() => {
    return fills.slice(0, 5).map(fill => ({
      coin: fill.coin,
      side: fill.side,
      size: fill.sz,
      price: fill.px,
      pnl: fill.closedPnl,
      time: fill.time,
    }));
  }, [fills]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        {(['portfolio', 'market', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[9px] uppercase font-medium tracking-wider transition-colors ${
              activeTab === tab
                ? 'text-[#50E3C2] border-b-2 border-[#50E3C2] bg-[#50E3C2]/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="p-2 space-y-3">
            {/* Account Value - Large Display */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#50E3C2]/10 to-transparent border border-[#50E3C2]/20">
              <div className="text-[9px] text-gray-500 uppercase mb-1">Account Value</div>
              <div className="text-xl font-bold font-mono text-white">
                ${new BigNumber(accountValue).toFormat(2)}
              </div>
              <div className={`text-[10px] font-mono mt-1 ${new BigNumber(totalPnl).gte(0) ? 'text-green-400' : 'text-red-400'}`}>
                {new BigNumber(totalPnl).gte(0) ? '+' : ''}${new BigNumber(totalPnl).toFormat(2)} uPnL
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <QuickStat
                icon={<Wallet className="w-3 h-3" />}
                label="Free Margin"
                value={`$${new BigNumber(withdrawable).toFormat(0)}`}
              />
              <QuickStat
                icon={<BarChart3 className="w-3 h-3" />}
                label="Used Margin"
                value={`$${new BigNumber(marginUsed).toFormat(0)}`}
              />
              <QuickStat
                icon={<Percent className="w-3 h-3" />}
                label="Margin Use"
                value={`${marginUtilization.toFixed(1)}%`}
                highlight={marginUtilization > 80}
              />
              <QuickStat
                icon={<Zap className="w-3 h-3" />}
                label="Leverage"
                value={`${leverageUsed.toFixed(1)}x`}
                highlight={leverageUsed > 10}
              />
            </div>

            {/* Positions List */}
            {positionList.length > 0 && (
              <div>
                <div className="text-[9px] uppercase text-gray-500 font-medium tracking-wider mb-2 flex items-center justify-between">
                  <span>Positions ({positionList.length})</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
                <div className="space-y-1">
                  {positionList.map(({ position }) => {
                    const pnl = new BigNumber(position.unrealizedPnl);
                    const isLong = new BigNumber(position.szi).gt(0);
                    const roe = new BigNumber(position.returnOnEquity).times(100);
                    return (
                      <div key={position.coin} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {isLong ? 'L' : 'S'}
                            </span>
                            <span className="text-[11px] font-mono text-white">{position.coin}</span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${pnl.gte(0) ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl.gte(0) ? '+' : ''}${pnl.toFormat(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[9px] text-gray-500">
                          <span>{new BigNumber(position.szi).abs().toFormat(4)}</span>
                          <span className={`${roe.gte(0) ? 'text-green-400' : 'text-red-400'}`}>
                            {roe.gte(0) ? '+' : ''}{roe.toFormat(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div className="p-2 space-y-3">
            {/* Current Market Header */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{currentCoin}-PERP</span>
                <span className={`text-xs font-mono font-bold ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                </span>
              </div>
              {currentStats && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mark</span>
                    <span className="font-mono text-white">${new BigNumber(currentStats.markPx || 0).toFormat(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Index</span>
                    <span className="font-mono text-white">${new BigNumber(currentStats.oraclePx || 0).toFormat(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">24h Vol</span>
                    <span className="font-mono text-white">${new BigNumber(currentStats.dayNtlVlm || 0).dividedBy(1e6).toFormat(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">OI</span>
                    <span className="font-mono text-white">${new BigNumber(currentStats.openInterest || 0).dividedBy(1e6).toFormat(1)}M</span>
                  </div>
                  <div className="col-span-2 flex justify-between pt-1 border-t border-white/5">
                    <span className="text-gray-500">Funding (8h)</span>
                    <span className={`font-mono font-bold ${new BigNumber(currentStats.funding || 0).gte(0) ? 'text-green-400' : 'text-red-400'}`}>
                      {new BigNumber(currentStats.funding || 0).times(100).toFixed(4)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Gainers */}
            <div>
              <div className="text-[9px] uppercase text-green-400 font-medium tracking-wider mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Top Gainers
              </div>
              <div className="space-y-1">
                {topGainers.map((m, i) => m && (
                  <div key={m.coin} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-green-500/5 hover:bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-bold">{i + 1}</span>
                      <span className="text-white font-mono">{m.coin}</span>
                    </div>
                    <span className="font-mono text-green-400 font-bold">+{m.change.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <div className="text-[9px] uppercase text-red-400 font-medium tracking-wider mb-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Top Losers
              </div>
              <div className="space-y-1">
                {topLosers.map((m, i) => m && (
                  <div key={m.coin} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-red-500/5 hover:bg-red-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-bold">{i + 1}</span>
                      <span className="text-white font-mono">{m.coin}</span>
                    </div>
                    <span className="font-mono text-red-400 font-bold">{m.change.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="p-2 space-y-3">
            {/* Recent Trades */}
            <div>
              <div className="text-[9px] uppercase text-gray-500 font-medium tracking-wider mb-2 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Recent Fills
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-[10px]">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((trade, i) => {
                    const pnl = new BigNumber(trade.pnl);
                    const isBuy = trade.side === 'B';
                    return (
                      <div key={`${trade.coin}-${trade.time}-${i}`} className="p-2 rounded-lg bg-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {isBuy ? 'BUY' : 'SELL'}
                            </span>
                            <span className="text-[10px] font-mono text-white">{trade.coin}</span>
                          </div>
                          {!pnl.isZero() && (
                            <span className={`text-[10px] font-mono ${pnl.gte(0) ? 'text-green-400' : 'text-red-400'}`}>
                              {pnl.gte(0) ? '+' : ''}${pnl.toFormat(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[9px] text-gray-500">
                          <span>{new BigNumber(trade.size).toFormat(4)} @ ${new BigNumber(trade.price).toFormat(2)}</span>
                          <span>{new Date(trade.time).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
  highlight = false
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-2 rounded-lg transition-colors ${
      highlight ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5 border border-transparent'
    }`}>
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-[8px] uppercase">{label}</span>
      </div>
      <div className={`text-[11px] font-mono font-bold ${highlight ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </div>
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

        {/* Analytics Dashboard Panel - Left (Expanded) */}
        <div className="hidden xl:flex flex-col w-56 glass border-r border-white/5 flex-shrink-0">
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
