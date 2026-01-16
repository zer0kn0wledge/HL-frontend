"use client";

import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTradingStore } from "@/store/trading-store";
import { usePlaceOrder } from "@/hooks/use-hyperliquid";
import { formatPrice, formatSize, formatUSD, formatPnL, cn } from "@/lib/utils";
import { ASSET_INDEXES } from "@/lib/constants";
import { X } from "lucide-react";

export function Positions() {
  const { isConnected } = useAccount();
  const positions = useTradingStore((s) => s.positions);
  const midPrices = useTradingStore((s) => s.midPrices);
  const setSelectedCoin = useTradingStore((s) => s.setSelectedCoin);

  const placeOrderMutation = usePlaceOrder();

  // Filter to only show positions with non-zero size
  const activePositions = positions.filter((p) => parseFloat(p.szi) !== 0);

  const handleClosePosition = async (coin: string, size: string) => {
    const isLong = parseFloat(size) > 0;
    const absSize = Math.abs(parseFloat(size)).toString();
    const assetIndex = ASSET_INDEXES[coin] ?? 0;
    const currentPrice = midPrices[coin] || "0";

    try {
      await placeOrderMutation.mutateAsync({
        assetIndex,
        isBuy: !isLong, // Opposite side to close
        price: currentPrice,
        size: absSize,
        reduceOnly: true,
        orderType: "market",
      });
    } catch (error) {
      console.error("Failed to close position:", error);
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">Connect wallet to view positions</p>
      </Card>
    );
  }

  if (activePositions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">No open positions</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Entry Price</th>
              <th className="px-4 py-3 font-medium">Mark Price</th>
              <th className="px-4 py-3 font-medium">Liq. Price</th>
              <th className="px-4 py-3 font-medium">uPnL</th>
              <th className="px-4 py-3 font-medium">ROE</th>
              <th className="px-4 py-3 font-medium">Margin</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {activePositions.map((position) => {
              const isLong = parseFloat(position.szi) > 0;
              const pnl = parseFloat(position.unrealizedPnl);
              const roe = parseFloat(position.returnOnEquity);
              const markPrice = midPrices[position.coin] || "0";

              return (
                <tr
                  key={position.coin}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedCoin(position.coin)}
                      className="flex items-center gap-2 hover:text-white"
                    >
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded text-xs font-bold",
                          isLong ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {isLong ? "L" : "S"}
                      </div>
                      <span className="font-medium text-white">{position.coin}</span>
                      <span className="text-xs text-zinc-500">
                        {position.leverage?.value}x
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("font-mono text-sm", isLong ? "text-green-400" : "text-red-400")}>
                      {formatSize(position.szi)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white">
                    ${formatPrice(position.entryPx)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white">
                    ${formatPrice(markPrice)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-400">
                    {position.liquidationPx ? `$${formatPrice(position.liquidationPx)}` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("font-mono text-sm", pnl >= 0 ? "text-green-400" : "text-red-400")}>
                      {formatPnL(pnl)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm", roe >= 0 ? "text-green-400" : "text-red-400")}>
                      {(roe * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-400">
                    {formatUSD(position.marginUsed)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => handleClosePosition(position.coin, position.szi)}
                      disabled={placeOrderMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
