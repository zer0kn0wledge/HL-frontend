"use client";

import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTradingStore } from "@/store/trading-store";
import { useCancelOrder } from "@/hooks/use-hyperliquid";
import { formatPrice, formatSize, formatTimestamp, cn } from "@/lib/utils";
import { ASSET_INDEXES } from "@/lib/constants";
import { X } from "lucide-react";

export function OpenOrders() {
  const { isConnected } = useAccount();
  const openOrders = useTradingStore((s) => s.openOrders);
  const setSelectedCoin = useTradingStore((s) => s.setSelectedCoin);

  const cancelOrderMutation = useCancelOrder();

  const handleCancelOrder = async (coin: string, orderId: number) => {
    const assetIndex = ASSET_INDEXES[coin] ?? 0;
    try {
      await cancelOrderMutation.mutateAsync({ assetIndex, orderId });
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">Connect wallet to view orders</p>
      </Card>
    );
  }

  if (openOrders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">No open orders</p>
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
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Filled</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {openOrders.map((order) => {
              const isBuy = order.side === "B";
              const filledSize = parseFloat(order.origSz) - parseFloat(order.sz);
              const filledPercent = (filledSize / parseFloat(order.origSz)) * 100;

              return (
                <tr
                  key={order.oid}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedCoin(order.coin)}
                      className="font-medium text-white hover:underline"
                    >
                      {order.coin}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        isBuy
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      )}
                    >
                      {isBuy ? "Buy" : "Sell"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {order.reduceOnly ? "Reduce" : "Limit"}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white">
                    ${formatPrice(order.limitPx)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white">
                    {formatSize(order.origSz)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-700">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${filledPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">
                        {filledPercent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatTimestamp(order.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => handleCancelOrder(order.coin, order.oid)}
                      disabled={cancelOrderMutation.isPending}
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
