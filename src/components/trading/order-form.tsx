"use client";

import { useState, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTradingStore, selectCurrentMidPrice, selectAccountValue } from "@/store/trading-store";
import { usePlaceOrder, useUpdateLeverage } from "@/hooks/use-hyperliquid";
import { formatPrice, formatUSD, calculateNotional, cn } from "@/lib/utils";
import { ASSET_INDEXES, MIN_LEVERAGE, MAX_LEVERAGE } from "@/lib/constants";
import { Minus, Plus } from "lucide-react";

type OrderType = "limit" | "market";
type OrderSide = "buy" | "sell";

export function OrderForm() {
  const { isConnected } = useAccount();
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [side, setSide] = useState<OrderSide>("buy");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [reduceOnly, setReduceOnly] = useState(false);

  const selectedCoin = useTradingStore((s) => s.selectedCoin);
  const leverage = useTradingStore((s) => s.leverage);
  const setLeverage = useTradingStore((s) => s.setLeverage);
  const midPrice = useTradingStore(selectCurrentMidPrice);
  const accountValue = useTradingStore(selectAccountValue);
  const isBuilderApproved = useTradingStore((s) => s.isBuilderApproved);
  const setShowBuilderApprovalModal = useTradingStore((s) => s.setShowBuilderApprovalModal);

  const placeOrderMutation = usePlaceOrder();
  const updateLeverageMutation = useUpdateLeverage();

  const assetIndex = ASSET_INDEXES[selectedCoin] ?? 0;
  const isBuy = side === "buy";

  // Calculate notional value
  const notional = useMemo(() => {
    const priceVal = orderType === "market" ? parseFloat(midPrice) : parseFloat(price) || 0;
    return calculateNotional(priceVal, parseFloat(size) || 0);
  }, [orderType, price, size, midPrice]);

  // Calculate required margin
  const requiredMargin = useMemo(() => {
    return notional / leverage;
  }, [notional, leverage]);

  const handleLeverageChange = useCallback(
    async (newLeverage: number) => {
      const clampedLeverage = Math.max(MIN_LEVERAGE, Math.min(MAX_LEVERAGE, newLeverage));
      setLeverage(clampedLeverage);

      if (isConnected) {
        try {
          await updateLeverageMutation.mutateAsync({
            assetIndex,
            leverage: clampedLeverage,
          });
        } catch (error) {
          console.error("Failed to update leverage:", error);
        }
      }
    },
    [assetIndex, isConnected, setLeverage, updateLeverageMutation]
  );

  const handleSubmit = useCallback(async () => {
    if (!isConnected) return;

    // Check builder approval first
    if (!isBuilderApproved) {
      setShowBuilderApprovalModal(true);
      return;
    }

    const orderPrice = orderType === "market" ? midPrice : price;
    if (!orderPrice || !size) return;

    try {
      await placeOrderMutation.mutateAsync({
        assetIndex,
        isBuy,
        price: orderPrice,
        size,
        reduceOnly,
        orderType,
        timeInForce: "Gtc",
      });

      // Reset form on success
      setPrice("");
      setSize("");
    } catch (error) {
      console.error("Failed to place order:", error);
    }
  }, [
    isConnected,
    isBuilderApproved,
    setShowBuilderApprovalModal,
    orderType,
    price,
    size,
    midPrice,
    assetIndex,
    isBuy,
    reduceOnly,
    placeOrderMutation,
  ]);

  // Size percentage buttons
  const handleSizePercent = (percent: number) => {
    const availableMargin = parseFloat(accountValue) || 0;
    const priceVal = orderType === "market" ? parseFloat(midPrice) : parseFloat(price) || parseFloat(midPrice);
    if (!priceVal) return;

    const maxNotional = availableMargin * leverage * percent;
    const maxSize = maxNotional / priceVal;
    setSize(maxSize.toFixed(4));
  };

  return (
    <Card className="flex flex-col">
      <CardContent className="p-4">
        {/* Order Type Tabs */}
        <Tabs defaultValue="limit" className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="limit" onClick={() => setOrderType("limit")}>
              Limit
            </TabsTrigger>
            <TabsTrigger value="market" onClick={() => setOrderType("market")}>
              Market
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Buy/Sell Toggle */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={isBuy ? "success" : "ghost"}
            className={cn("flex-1", isBuy && "bg-green-600 hover:bg-green-700")}
            onClick={() => setSide("buy")}
          >
            Long
          </Button>
          <Button
            variant={!isBuy ? "danger" : "ghost"}
            className={cn("flex-1", !isBuy && "bg-red-600 hover:bg-red-700")}
            onClick={() => setSide("sell")}
          >
            Short
          </Button>
        </div>

        {/* Leverage Slider */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Leverage</span>
            <span className="text-sm font-medium text-white">{leverage}x</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleLeverageChange(leverage - 1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="range"
              min={MIN_LEVERAGE}
              max={MAX_LEVERAGE}
              value={leverage}
              onChange={(e) => handleLeverageChange(parseInt(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-green-500"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleLeverageChange(leverage + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Price Input (Limit only) */}
        {orderType === "limit" && (
          <div className="mb-3">
            <Input
              label="Price"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              suffix="USD"
            />
          </div>
        )}

        {/* Size Input */}
        <div className="mb-3">
          <Input
            label="Size"
            type="number"
            placeholder="0.0000"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            suffix={selectedCoin}
          />
          <div className="mt-2 flex gap-1">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                onClick={() => handleSizePercent(pct)}
                className="flex-1 rounded bg-zinc-800 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white"
              >
                {pct * 100}%
              </button>
            ))}
          </div>
        </div>

        {/* Reduce Only Toggle */}
        <label className="mb-4 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={reduceOnly}
            onChange={(e) => setReduceOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500"
          />
          <span className="text-xs text-zinc-400">Reduce Only</span>
        </label>

        {/* Order Summary */}
        <div className="mb-4 space-y-2 rounded-lg bg-zinc-800/50 p-3">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Notional Value</span>
            <span className="text-white">{formatUSD(notional)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Required Margin</span>
            <span className="text-white">{formatUSD(requiredMargin)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Est. Entry Price</span>
            <span className="text-white">
              ${formatPrice(orderType === "market" ? midPrice : price || "0")}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          variant={isBuy ? "success" : "danger"}
          className={cn(
            "w-full",
            isBuy ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          )}
          onClick={handleSubmit}
          disabled={!isConnected || placeOrderMutation.isPending}
          isLoading={placeOrderMutation.isPending}
        >
          {!isConnected
            ? "Connect Wallet"
            : `${isBuy ? "Long" : "Short"} ${selectedCoin}`}
        </Button>

        {placeOrderMutation.isError && (
          <p className="mt-2 text-center text-xs text-red-500">
            {(placeOrderMutation.error as Error)?.message || "Failed to place order"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
