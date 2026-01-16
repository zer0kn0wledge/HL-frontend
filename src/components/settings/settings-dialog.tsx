"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore, useSettingsStore } from "@/store";
import { TRADING, TIME_IN_FORCE } from "@/lib/constants";
import {
  Settings,
  Bell,
  Palette,
  TrendingUp,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

// ============================================
// Trading Settings Tab
// ============================================

function TradingSettingsTab() {
  const {
    defaultLeverage,
    defaultMarginMode,
    confirmOrders,
    defaultTif,
    slippage,
    setDefaultLeverage,
    setDefaultMarginMode,
    setConfirmOrders,
    setDefaultTif,
    setSlippage,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Default Leverage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Default Leverage</Label>
          <span className="text-sm font-mono text-muted-foreground">
            {defaultLeverage}x
          </span>
        </div>
        <Slider
          value={[defaultLeverage]}
          onValueChange={([v]) => setDefaultLeverage(v)}
          min={TRADING.MIN_LEVERAGE}
          max={TRADING.MAX_LEVERAGE}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{TRADING.MIN_LEVERAGE}x</span>
          <span>{TRADING.MAX_LEVERAGE}x</span>
        </div>
      </div>

      <Separator />

      {/* Margin Mode */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Default Margin Mode</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross or Isolated margin for new positions
          </p>
        </div>
        <Select value={defaultMarginMode} onValueChange={(v) => setDefaultMarginMode(v as "cross" | "isolated")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cross">Cross</SelectItem>
            <SelectItem value="isolated">Isolated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Time in Force */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Default Time in Force</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Default order expiration behavior
          </p>
        </div>
        <Select value={defaultTif} onValueChange={(v) => setDefaultTif(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_IN_FORCE.map((tif) => (
              <SelectItem key={tif.value} value={tif.value}>
                {tif.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Slippage Tolerance */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Slippage Tolerance</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Maximum price slippage for market orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            className="w-20 text-right font-mono"
            min="0.1"
            max="5"
            step="0.1"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      <Separator />

      {/* Order Confirmation */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Confirm Orders</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Show confirmation dialog before placing orders
          </p>
        </div>
        <Switch checked={confirmOrders} onCheckedChange={setConfirmOrders} />
      </div>
    </div>
  );
}

// ============================================
// Display Settings Tab
// ============================================

function DisplaySettingsTab() {
  const {
    theme,
    showPnlPercent,
    orderbookGrouping,
    setTheme,
    setShowPnlPercent,
    setOrderbookGrouping,
  } = useSettingsStore();

  const groupings = [0.01, 0.1, 1, 5, 10, 50, 100];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Theme</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose your preferred color scheme
          </p>
        </div>
        <Select value={theme} onValueChange={(v) => setTheme(v as "dark" | "light")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="light">Light</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* PnL Display */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Show PnL as Percentage</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Display PnL as percentage instead of USD
          </p>
        </div>
        <Switch checked={showPnlPercent} onCheckedChange={setShowPnlPercent} />
      </div>

      <Separator />

      {/* Orderbook Grouping */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Default Orderbook Grouping</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Price level grouping for the orderbook
          </p>
        </div>
        <Select
          value={String(orderbookGrouping)}
          onValueChange={(v) => setOrderbookGrouping(parseFloat(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groupings.map((g) => (
              <SelectItem key={g} value={String(g)}>
                {g < 1 ? g.toFixed(2) : g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============================================
// Notifications Settings Tab
// ============================================

function NotificationsSettingsTab() {
  const { soundEnabled, setSoundEnabled } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Sound */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Sound Effects</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Play sound on order fills and notifications
          </p>
        </div>
        <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
      </div>

      <Separator />

      {/* Browser Notifications (placeholder) */}
      <div className="flex items-center justify-between opacity-50">
        <div>
          <Label className="text-sm">Browser Notifications</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Receive notifications when orders fill
          </p>
        </div>
        <Switch disabled />
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        Browser notifications coming soon. Stay tuned for updates!
      </div>
    </div>
  );
}

// ============================================
// About Tab
// ============================================

function AboutTab() {
  const { resetSettings } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
          <span className="text-3xl">🐱</span>
        </div>
        <h3 className="font-bold text-lg">Zero's Hypurr Terminal</h3>
        <p className="text-xs text-muted-foreground">
          The ultimate DeFi perpetual trading platform
        </p>
        <p className="text-xs text-muted-foreground">Version 1.0.0</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Quick Links</h4>
        <div className="grid gap-2">
          <a
            href="https://hyperliquid.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Hyperliquid Official
          </a>
          <a
            href="https://hyperliquid.gitbook.io/hyperliquid-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Documentation
          </a>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Reset</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSettings}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All Settings
        </Button>
        <p className="text-xs text-muted-foreground">
          This will reset all settings to their default values.
        </p>
      </div>
    </div>
  );
}

// ============================================
// Settings Dialog
// ============================================

export function SettingsDialog() {
  const { isSettingsOpen, setSettingsOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState("trading");

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="trading" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Display
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5">
              About
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <div className="p-4">
              <TabsContent value="trading" className="m-0">
                <TradingSettingsTab />
              </TabsContent>
              <TabsContent value="display" className="m-0">
                <DisplaySettingsTab />
              </TabsContent>
              <TabsContent value="notifications" className="m-0">
                <NotificationsSettingsTab />
              </TabsContent>
              <TabsContent value="about" className="m-0">
                <AboutTab />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
