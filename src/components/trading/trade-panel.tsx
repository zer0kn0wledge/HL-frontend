"use client";

import { useMemo, useCallback, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { Minus, Plus, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  useAppStore,
  useMarketStore,
  useUserStore,
  selectAccountValue,
  selectPosition,
} from "@/store";
import { TRADING, TWAP, ORDER_TYPES, TIME_IN_FORCE, PERP_ASSET_INDEXES } from "@/lib/constants";
import {
  createExchangeClient,
  placeOrder,
  placeTriggerOrder,
  placeTwapOrder,
  updateLeverage,
  approveBuilderFee,
} from "@/lib/hyperliquid";
import type { OrderType, OrderSide, TimeInForce } from "@/types";
import BigNumber from "bignumber.js";

// ============================================
// Side Toggle
// ============================================

interface SideToggleProps {
  side: OrderSide;
  onChange: (side: OrderSide) => void;
}

function SideToggle({ side, onChange }: SideToggleProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      <button
        onClick={() => onChange("buy")}
        className={cn(
          "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
          side === "buy"
            ? "bg-long text-long-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Long
      </button>
      <button
        onClick={() => onChange("sell")}
        className={cn(
          "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
          side === "sell"
            ? "bg-short text-short-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Short
      </button>
    </div>
  );
}

// ============================================
// Leverage Control
// ============================================

interface LeverageControlProps {
  leverage: number;
  maxLeverage: number;
  onChange: (leverage: number) => void;
}

function LeverageControl({ leverage, maxLeverage, onChange }: LeverageControlProps) {
  const quickLeverage = [1, 2, 5, 10, 20, 25, 50].filter((l) => l <= maxLeverage);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Leverage</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onChange(Math.max(1, leverage - 1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="font-mono font-medium w-10 text-center">{leverage}x</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onChange(Math.min(maxLeverage, leverage + 1))}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <Slider
        value={[leverage]}
        min={1}
        max={maxLeverage}
        step={1}
        onValueChange={(v) => onChange(v[0])}
        className="py-2"
      />
      <div className="flex gap-1">
        {quickLeverage.map((l) => (
          <Button
            key={l}
            variant={leverage === l ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => onChange(l)}
          >
            {l}x
          </Button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Order Summary
// ============================================

interface OrderSummaryProps {
  notional: BigNumber;
  margin: BigNumber;
  fee: BigNumber;
  entryPrice: string;
}

function OrderSummary({ notional, margin, fee, entryPrice }: OrderSummaryProps) {
  return (
    <div className="space-y-1.5 rounded-lg bg-muted/50 p-3">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Notional</span>
        <span className="font-mono">${notional.toFormat(2)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Margin Required</span>
        <span className="font-mono">${margin.toFormat(2)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Est. Fee</span>
        <span className="font-mono">${fee.toFormat(4)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Entry Price</span>
        <span className="font-mono">{entryPrice}</span>
      </div>
    </div>
  );
}

// ============================================
// Main Trade Panel
// ============================================

export function TradePanel() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { currentCoin, currentMarketType, isBuilderApproved, setShowBuilderApprovalModal, setBuilderApproved } =
    useAppStore();
  const { marketStats, perpMarkets } = useMarketStore();
  const { tradeForm, accountState } = useUserStore();
  const {
    setOrderType,
    setSide,
    setSize,
    setPrice,
    setTriggerPrice,
    setReduceOnly,
    setPostOnly,
    setTif,
    setLeverage,
    setTwapDuration,
    setTwapRandomize,
    setTakeProfitPrice,
    setStopLossPrice,
  } = useUserStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get market info
  const market = perpMarkets.find((m) => m.coin === currentCoin);
  const stats = marketStats[currentCoin];
  const midPrice = stats?.midPx || "0";
  const maxLeverage = market?.maxLeverage || TRADING.MAX_LEVERAGE;
  const assetIndex = PERP_ASSET_INDEXES[currentCoin] ?? -1;

  // Account value
  const accountValue = new BigNumber(
    accountState?.marginSummary.accountValue || 0
  );

  // Calculate order values
  const calculations = useMemo(() => {
    const price = tradeForm.orderType === "market" ? midPrice : tradeForm.price;
    const priceNum = new BigNumber(price || 0);
    const sizeNum = new BigNumber(tradeForm.size || 0);

    const notional = priceNum.times(sizeNum);
    const margin = notional.dividedBy(tradeForm.leverage);
    const fee = notional.times(0.0002); // 0.02% taker fee estimate

    return {
      notional,
      margin,
      fee,
      entryPrice: priceNum.gt(0) ? `$${priceNum.toFormat(2)}` : "-",
    };
  }, [tradeForm, midPrice]);

  // Size percentage handler
  const handleSizePercent = useCallback(
    (percent: number) => {
      const priceNum = new BigNumber(
        tradeForm.orderType === "market" ? midPrice : tradeForm.price || midPrice
      );
      if (priceNum.isZero()) return;

      const maxNotional = accountValue.times(tradeForm.leverage).times(percent);
      const maxSize = maxNotional.dividedBy(priceNum);
      setSize(maxSize.toFixed(4));
    },
    [tradeForm, midPrice, accountValue, setSize]
  );

  // Submit order
  const handleSubmit = useCallback(async () => {
    if (!isConnected || !walletClient || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (assetIndex < 0) {
      toast.error("Invalid market");
      return;
    }

    if (!tradeForm.size || new BigNumber(tradeForm.size).lte(0)) {
      toast.error("Please enter a valid size");
      return;
    }

    // Check builder approval
    if (!isBuilderApproved) {
      setShowBuilderApprovalModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const exchangeClient = createExchangeClient(walletClient);
      const isBuy = tradeForm.side === "buy";
      const price =
        tradeForm.orderType === "market" ? midPrice : tradeForm.price;

      if (tradeForm.orderType === "twap") {
        // TWAP order
        await placeTwapOrder({
          exchangeClient,
          assetIndex,
          isBuy,
          size: tradeForm.size,
          reduceOnly: tradeForm.reduceOnly,
          minutes: tradeForm.twapDuration,
          randomize: tradeForm.twapRandomize,
        });
      } else if (
        tradeForm.orderType === "stop_market" ||
        tradeForm.orderType === "stop_limit"
      ) {
        // Stop/Trigger order
        await placeTriggerOrder({
          exchangeClient,
          assetIndex,
          isBuy,
          triggerPrice: tradeForm.triggerPrice,
          size: tradeForm.size,
          limitPrice:
            tradeForm.orderType === "stop_limit" ? price : undefined,
          reduceOnly: tradeForm.reduceOnly,
          tpsl: "sl",
        });
      } else {
        // Regular limit/market order
        await placeOrder({
          exchangeClient,
          assetIndex,
          isBuy,
          price: price || "0",
          size: tradeForm.size,
          reduceOnly: tradeForm.reduceOnly,
          orderType: tradeForm.orderType === "market" ? "market" : "limit",
          timeInForce: tradeForm.tif,
        });
      }

      toast.success("Order placed successfully");
      setSize("");
      setPrice("");
      setTriggerPrice("");
    } catch (error) {
      console.error("Order failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to place order"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isConnected,
    walletClient,
    address,
    assetIndex,
    tradeForm,
    midPrice,
    isBuilderApproved,
    setShowBuilderApprovalModal,
    setSize,
    setPrice,
    setTriggerPrice,
  ]);

  // Handle leverage change with API update
  const handleLeverageChange = useCallback(
    async (newLeverage: number) => {
      setLeverage(newLeverage);

      if (isConnected && walletClient && assetIndex >= 0) {
        try {
          const exchangeClient = createExchangeClient(walletClient);
          await updateLeverage(exchangeClient, assetIndex, newLeverage, true);
        } catch (error) {
          console.error("Failed to update leverage:", error);
        }
      }
    },
    [isConnected, walletClient, assetIndex, setLeverage]
  );

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium">Trade</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Order Type Tabs */}
        <Tabs
          value={tradeForm.orderType}
          onValueChange={(v) => setOrderType(v as OrderType)}
        >
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="limit" className="text-xs">
              Limit
            </TabsTrigger>
            <TabsTrigger value="market" className="text-xs">
              Market
            </TabsTrigger>
            <TabsTrigger value="stop_market" className="text-xs">
              Stop
            </TabsTrigger>
            <TabsTrigger value="twap" className="text-xs">
              TWAP
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Side Toggle */}
        <SideToggle side={tradeForm.side} onChange={setSide} />

        {/* Leverage Control (Perps only) */}
        {currentMarketType === "perp" && (
          <LeverageControl
            leverage={tradeForm.leverage}
            maxLeverage={maxLeverage}
            onChange={handleLeverageChange}
          />
        )}

        {/* Price Input (Limit, Stop Limit) */}
        {(tradeForm.orderType === "limit" ||
          tradeForm.orderType === "stop_limit") && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Price</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={tradeForm.price}
                onChange={(e) => setPrice(e.target.value)}
                className="pr-12 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                USD
              </span>
            </div>
          </div>
        )}

        {/* Trigger Price (Stop orders) */}
        {(tradeForm.orderType === "stop_market" ||
          tradeForm.orderType === "stop_limit") && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Trigger Price
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={tradeForm.triggerPrice}
                onChange={(e) => setTriggerPrice(e.target.value)}
                className="pr-12 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                USD
              </span>
            </div>
          </div>
        )}

        {/* TWAP Settings */}
        {tradeForm.orderType === "twap" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Duration (minutes)
              </Label>
              <Input
                type="number"
                min={TWAP.MIN_DURATION}
                max={TWAP.MAX_DURATION}
                value={tradeForm.twapDuration}
                onChange={(e) => setTwapDuration(parseInt(e.target.value) || TWAP.DEFAULT_DURATION)}
                className="font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Randomize Timing
              </Label>
              <Switch
                checked={tradeForm.twapRandomize}
                onCheckedChange={setTwapRandomize}
              />
            </div>
          </div>
        )}

        {/* Size Input */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Size</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.0000"
              value={tradeForm.size}
              onChange={(e) => setSize(e.target.value)}
              className="pr-12 font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {currentCoin}
            </span>
          </div>
          <div className="flex gap-1">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <Button
                key={pct}
                variant="ghost"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleSizePercent(pct)}
              >
                {pct * 100}%
              </Button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="reduce-only"
              checked={tradeForm.reduceOnly}
              onCheckedChange={setReduceOnly}
            />
            <Label htmlFor="reduce-only" className="text-xs cursor-pointer">
              Reduce Only
            </Label>
          </div>
          {tradeForm.orderType === "limit" && (
            <div className="flex items-center gap-2">
              <Switch
                id="post-only"
                checked={tradeForm.postOnly}
                onCheckedChange={setPostOnly}
              />
              <Label htmlFor="post-only" className="text-xs cursor-pointer">
                Post Only
              </Label>
            </div>
          )}
        </div>

        {/* TIF Selector (Limit orders) */}
        {tradeForm.orderType === "limit" && !tradeForm.postOnly && (
          <div className="flex gap-1">
            {TIME_IN_FORCE.map((tif) => (
              <TooltipProvider key={tif.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={tradeForm.tif === tif.value ? "secondary" : "ghost"}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setTif(tif.value as TimeInForce)}
                    >
                      {tif.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tif.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Order Summary */}
        <OrderSummary {...calculations} />

        {/* Submit Button */}
        <Button
          className={cn(
            "w-full h-11",
            tradeForm.side === "buy"
              ? "bg-long hover:bg-long/90"
              : "bg-short hover:bg-short/90"
          )}
          onClick={handleSubmit}
          disabled={!isConnected || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : !isConnected ? (
            "Connect Wallet"
          ) : (
            `${tradeForm.side === "buy" ? "Long" : "Short"} ${currentCoin}`
          )}
        </Button>
      </div>
    </div>
  );
}

// Export legacy name for backwards compatibility
export { TradePanel as OrderForm };
