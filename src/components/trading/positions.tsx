"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { X, Plus, Target, Shield, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useAppStore,
  useMarketStore,
  useUserStore,
  selectPositionWithTpSl,
} from "@/store";
import { PERP_ASSET_INDEXES } from "@/lib/constants";
import {
  createExchangeClient,
  placeOrder,
  placeTriggerOrder,
  cancelOrder,
} from "@/lib/hyperliquid";
import type { Position, OpenOrder } from "@/types";
import BigNumber from "bignumber.js";

// ============================================
// TP/SL Dialog
// ============================================

interface TpSlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position;
  type: "tp" | "sl";
  existingOrders: OpenOrder[];
}

function TpSlDialog({
  open,
  onOpenChange,
  position,
  type,
  existingOrders,
}: TpSlDialogProps) {
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: walletClient } = useWalletClient();

  const isLong = new BigNumber(position.szi).gt(0);
  const assetIndex = PERP_ASSET_INDEXES[position.coin] ?? -1;

  const handleSubmit = useCallback(async () => {
    if (!walletClient || !price) return;

    setIsSubmitting(true);
    try {
      const exchangeClient = createExchangeClient(walletClient);

      // For TP: if long, sell (trigger when price >= target)
      // For SL: if long, sell (trigger when price <= target)
      const isBuy = isLong ? false : true;

      await placeTriggerOrder({
        exchangeClient,
        assetIndex,
        isBuy,
        triggerPrice: price,
        size: new BigNumber(position.szi).abs().toString(),
        reduceOnly: true,
        tpsl: type,
      });

      toast.success(`${type === "tp" ? "Take Profit" : "Stop Loss"} order placed`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  }, [walletClient, price, assetIndex, isLong, position.szi, type, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "tp" ? "Set Take Profit" : "Set Stop Loss"} for{" "}
            {position.coin}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Position</span>
              <span className={cn(isLong ? "text-long" : "text-short")}>
                {isLong ? "Long" : "Short"}{" "}
                {new BigNumber(position.szi).abs().toString()} {position.coin}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Entry Price</span>
              <span className="font-mono">
                ${new BigNumber(position.entryPx).toFormat(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {type === "tp" ? "Take Profit" : "Stop Loss"} Price
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-mono"
            />
          </div>

          {existingOrders.length > 0 && (
            <div className="text-xs text-muted-foreground">
              You have {existingOrders.length} existing{" "}
              {type === "tp" ? "TP" : "SL"} order(s) for this position.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!price || isSubmitting}
            className={type === "tp" ? "bg-long hover:bg-long/90" : "bg-short hover:bg-short/90"}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Position Row
// ============================================

interface PositionRowProps {
  position: Position;
  markPrice: string;
  tpOrders: OpenOrder[];
  slOrders: OpenOrder[];
  onClose: () => void;
  onSelectCoin: () => void;
}

function PositionRow({
  position,
  markPrice,
  tpOrders,
  slOrders,
  onClose,
  onSelectCoin,
}: PositionRowProps) {
  const [tpSlDialog, setTpSlDialog] = useState<"tp" | "sl" | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const { data: walletClient } = useWalletClient();

  const isLong = new BigNumber(position.szi).gt(0);
  const size = new BigNumber(position.szi).abs();
  const pnl = new BigNumber(position.unrealizedPnl);
  const roe = new BigNumber(position.returnOnEquity).times(100);

  const handleClose = useCallback(async () => {
    if (!walletClient) return;

    setIsClosing(true);
    try {
      const exchangeClient = createExchangeClient(walletClient);
      const assetIndex = PERP_ASSET_INDEXES[position.coin] ?? -1;

      await placeOrder({
        exchangeClient,
        assetIndex,
        isBuy: !isLong,
        price: markPrice,
        size: size.toString(),
        reduceOnly: true,
        orderType: "market",
      });

      toast.success("Position closed");
    } catch (error) {
      toast.error("Failed to close position");
    } finally {
      setIsClosing(false);
    }
  }, [walletClient, position.coin, isLong, markPrice, size]);

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
        <td className="px-3 py-2">
          <button
            onClick={onSelectCoin}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded text-xs font-bold",
                isLong ? "bg-long/20 text-long" : "bg-short/20 text-short"
              )}
            >
              {isLong ? "L" : "S"}
            </div>
            <span className="font-medium">{position.coin}</span>
            <span className="text-xs text-muted-foreground">
              {position.leverage?.value}x
            </span>
          </button>
        </td>
        <td className="px-3 py-2">
          <span className={cn("font-mono text-sm", isLong ? "text-long" : "text-short")}>
            {size.toFormat(4)}
          </span>
        </td>
        <td className="px-3 py-2 font-mono text-sm">
          ${new BigNumber(position.entryPx).toFormat(2)}
        </td>
        <td className="px-3 py-2 font-mono text-sm">
          ${new BigNumber(markPrice).toFormat(2)}
        </td>
        <td className="px-3 py-2 font-mono text-sm text-muted-foreground">
          {position.liquidationPx
            ? `$${new BigNumber(position.liquidationPx).toFormat(2)}`
            : "-"}
        </td>
        <td className="px-3 py-2">
          <span
            className={cn("font-mono text-sm", pnl.gte(0) ? "text-long" : "text-short")}
          >
            {pnl.gte(0) ? "+" : ""}${pnl.toFormat(2)}
          </span>
        </td>
        <td className="px-3 py-2">
          <span
            className={cn("text-sm", roe.gte(0) ? "text-long" : "text-short")}
          >
            {roe.gte(0) ? "+" : ""}{roe.toFixed(2)}%
          </span>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            {tpOrders.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-long/20 text-long">
                TP
              </span>
            )}
            {slOrders.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-short/20 text-short">
                SL
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTpSlDialog("tp")}>
                  <Target className="h-4 w-4 mr-2 text-long" />
                  Set Take Profit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTpSlDialog("sl")}>
                  <Shield className="h-4 w-4 mr-2 text-short" />
                  Set Stop Loss
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleClose}
                  className="text-short focus:text-short"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Position
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-short hover:bg-short/10"
              onClick={handleClose}
              disabled={isClosing}
            >
              {isClosing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </td>
      </tr>

      {tpSlDialog && (
        <TpSlDialog
          open={!!tpSlDialog}
          onOpenChange={() => setTpSlDialog(null)}
          position={position}
          type={tpSlDialog}
          existingOrders={tpSlDialog === "tp" ? tpOrders : slOrders}
        />
      )}
    </>
  );
}

// ============================================
// Main Positions Component
// ============================================

export function Positions() {
  const { isConnected } = useAccount();
  const { setCurrentMarket } = useAppStore();
  const { marketStats } = useMarketStore();
  const { positionsWithTpSl } = useUserStore();

  // Filter to only show positions with non-zero size
  const activePositions = positionsWithTpSl.filter(
    (p) => !new BigNumber(p.szi).isZero()
  );

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full bg-card rounded-lg border border-border">
        <div className="px-3 py-2 border-b border-border">
          <h3 className="text-sm font-medium">Positions</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">
            Connect wallet to view positions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium">
          Positions ({activePositions.length})
        </h3>
      </div>

      {activePositions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">No open positions</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Market</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Entry</th>
                <th className="px-3 py-2 font-medium">Mark</th>
                <th className="px-3 py-2 font-medium">Liq.</th>
                <th className="px-3 py-2 font-medium">uPnL</th>
                <th className="px-3 py-2 font-medium">ROE</th>
                <th className="px-3 py-2 font-medium">TP/SL</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {activePositions.map((position) => (
                <PositionRow
                  key={position.coin}
                  position={position}
                  markPrice={marketStats[position.coin]?.markPx || "0"}
                  tpOrders={position.tpOrders}
                  slOrders={position.slOrders}
                  onClose={() => {}}
                  onSelectCoin={() => setCurrentMarket("perp", position.coin)}
                />
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  );
}
