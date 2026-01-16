"use client";

import { useMemo } from "react";
import { Settings, Menu, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConnectButton } from "@/components/wallet/connect-button";
import { MarketSelectorButton } from "./market-selector";
import { useAppStore, useMarketStore, useUserStore } from "@/store";
import { cn } from "@/lib/utils";
import BigNumber from "bignumber.js";
import { BUILDER_CONFIG } from "@/lib/constants";

// ============================================
// Market Stats Bar
// ============================================

function MarketStatsBar() {
  const { currentCoin } = useAppStore();
  const { marketStats } = useMarketStore();

  const stats = marketStats[currentCoin];

  const items = useMemo(() => {
    if (!stats) return [];

    const volume = new BigNumber(stats.dayNtlVlm || 0);
    const openInterest = new BigNumber(stats.openInterest || 0);
    const funding = new BigNumber(stats.funding || 0).times(100);

    return [
      {
        label: "24h Volume",
        value: volume.gte(1e9)
          ? `$${volume.dividedBy(1e9).toFixed(2)}B`
          : volume.gte(1e6)
            ? `$${volume.dividedBy(1e6).toFixed(2)}M`
            : `$${volume.toFormat(0)}`,
      },
      {
        label: "Open Interest",
        value: openInterest.gte(1e9)
          ? `$${openInterest.dividedBy(1e9).toFixed(2)}B`
          : openInterest.gte(1e6)
            ? `$${openInterest.dividedBy(1e6).toFixed(2)}M`
            : `$${openInterest.toFormat(0)}`,
      },
      {
        label: "Funding Rate",
        value: `${funding.isPositive() ? "+" : ""}${funding.toFixed(4)}%`,
        color: funding.isPositive() ? "text-long" : funding.isNegative() ? "text-short" : undefined,
      },
      {
        label: "Mark Price",
        value: stats.markPx ? `$${formatCompactPrice(stats.markPx)}` : "-",
      },
    ];
  }, [stats]);

  return (
    <div className="hidden lg:flex items-center gap-4 text-xs">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          {i > 0 && <Separator orientation="vertical" className="h-4" />}
          <span className="text-muted-foreground">{item.label}</span>
          <span className={cn("font-mono", item.color)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function formatCompactPrice(price: string): string {
  const num = new BigNumber(price);
  if (num.gte(1000)) return num.toFormat(2);
  if (num.gte(1)) return num.toFormat(4);
  return num.toFormat(6);
}

// ============================================
// Account Summary
// ============================================

function AccountSummary() {
  const { accountState } = useUserStore();

  if (!accountState) return null;

  const accountValue = new BigNumber(accountState.marginSummary.accountValue);
  const unrealizedPnl = new BigNumber(accountState.marginSummary.totalRawUsd || 0);

  return (
    <div className="hidden md:flex items-center gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Account Value</span>
        <span className="font-mono font-medium">
          ${accountValue.toFormat(2)}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Connection Status
// ============================================

function ConnectionStatus() {
  const { isConnected, isWsConnected } = useAppStore();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isWsConnected ? "bg-long animate-pulse" : "bg-yellow-500"
              )}
            />
            {isWsConnected ? (
              <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isWsConnected
              ? "Connected to Hyperliquid"
              : "Connecting to Hyperliquid..."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// Header Component
// ============================================

export function Header() {
  const { setMobileMenuOpen, setSettingsOpen } = useAppStore();

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-xs font-bold text-white">HT</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold">{BUILDER_CONFIG.name}</div>
            <div className="text-[10px] text-muted-foreground">
              Hyperliquid Trading
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="h-6 hidden md:block" />

        {/* Market Selector */}
        <MarketSelectorButton />
      </div>

      {/* Center Section - Market Stats */}
      <MarketStatsBar />

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Account Summary */}
        <AccountSummary />

        <Separator orientation="vertical" className="h-6 hidden md:block" />

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Connect Button */}
        <ConnectButton />
      </div>
    </header>
  );
}
