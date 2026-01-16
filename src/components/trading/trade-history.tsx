"use client";

import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { useTradingStore } from "@/store/trading-store";
import { formatPrice, formatSize, formatUSD, formatTimestamp, cn } from "@/lib/utils";

export function TradeHistory() {
  const { isConnected } = useAccount();
  const fills = useTradingStore((s) => s.fills);

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">Connect wallet to view trade history</p>
      </Card>
    );
  }

  if (fills.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-500">No trade history</p>
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
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">Realized PnL</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {fills.slice(0, 50).map((fill, index) => {
              const isBuy = fill.side === "B";
              const pnl = parseFloat(fill.closedPnl);
              const hasPnl = pnl !== 0;

              return (
                <tr
                  key={`${fill.hash}-${index}`}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3 font-medium text-white">{fill.coin}</td>
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
                  <td className="px-4 py-3 font-mono text-sm text-white">
                    ${formatPrice(fill.px)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white">
                    {formatSize(fill.sz)}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {formatUSD(fill.fee)}
                  </td>
                  <td className="px-4 py-3">
                    {hasPnl ? (
                      <span
                        className={cn(
                          "font-mono text-sm",
                          pnl >= 0 ? "text-green-400" : "text-red-400"
                        )}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {formatUSD(pnl)}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatTimestamp(fill.time)}
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
