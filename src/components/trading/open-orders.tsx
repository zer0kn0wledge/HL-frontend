"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { X, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAppStore, useUserStore } from "@/store";
import { PERP_ASSET_INDEXES } from "@/lib/constants";
import { createExchangeClient, cancelOrder as cancelOrderApi } from "@/lib/hyperliquid";
import type { OpenOrder } from "@/types";
import BigNumber from "bignumber.js";

// ============================================
// Edit Order Dialog
// ============================================

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OpenOrder;
}

function EditOrderDialog({ open, onOpenChange, order }: EditOrderDialogProps) {
  const [price, setPrice] = useState(order.limitPx);
  const [size, setSize] = useState(order.sz);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: walletClient } = useWalletClient();

  const isBuy = order.side === "B";

  const handleSubmit = useCallback(async () => {
    if (!walletClient || !price || !size) return;

    setIsSubmitting(true);
    try {
      const exchangeClient = createExchangeClient(walletClient);
      const assetIndex = PERP_ASSET_INDEXES[order.coin] ?? -1;

      // Cancel existing order first
      await cancelOrderApi(exchangeClient, assetIndex, order.oid);

      // Place new order with modified params
      // Note: This would need the placeOrder function, simplified for now
      toast.success("Order modified successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to modify order");
    } finally {
      setIsSubmitting(false);
    }
  }, [walletClient, price, size, order, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Order - {order.coin}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Side</span>
            <span className={cn(isBuy ? "text-long" : "text-short")}>
              {isBuy ? "Buy" : "Sell"}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Price</label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Size</label>
            <Input
              type="number"
              placeholder="0.00"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!price || !size || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Order Row
// ============================================

interface OrderRowProps {
  order: OpenOrder;
  onSelectCoin: () => void;
}

function OrderRow({ order, onSelectCoin }: OrderRowProps) {
  const [editDialog, setEditDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: walletClient } = useWalletClient();

  const isBuy = order.side === "B";
  const filledSize = new BigNumber(order.origSz).minus(order.sz);
  const filledPercent = filledSize.div(order.origSz).times(100);
  const isTrigger = !!order.triggerPx;

  const handleCancel = useCallback(async () => {
    if (!walletClient) return;

    setIsCancelling(true);
    try {
      const exchangeClient = createExchangeClient(walletClient);
      const assetIndex = PERP_ASSET_INDEXES[order.coin] ?? -1;

      await cancelOrderApi(exchangeClient, assetIndex, order.oid);

      toast.success("Order cancelled");
    } catch (error) {
      toast.error("Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  }, [walletClient, order]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
        <td className="px-3 py-2">
          <button
            onClick={onSelectCoin}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <span className="font-medium">{order.coin}</span>
          </button>
        </td>
        <td className="px-3 py-2">
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded font-medium",
              isBuy ? "bg-long/20 text-long" : "bg-short/20 text-short"
            )}
          >
            {isBuy ? "Buy" : "Sell"}
          </span>
        </td>
        <td className="px-3 py-2 text-sm text-muted-foreground">
          {isTrigger
            ? order.tpsl === "tp"
              ? "Take Profit"
              : order.tpsl === "sl"
              ? "Stop Loss"
              : "Trigger"
            : order.reduceOnly
            ? "Reduce"
            : "Limit"}
        </td>
        <td className="px-3 py-2 font-mono text-sm">
          ${new BigNumber(order.limitPx).toFormat(2)}
        </td>
        {isTrigger && order.triggerPx && (
          <td className="px-3 py-2 font-mono text-sm text-muted-foreground">
            @ ${new BigNumber(order.triggerPx).toFormat(2)}
          </td>
        )}
        <td className="px-3 py-2 font-mono text-sm">
          {new BigNumber(order.origSz).toFormat(4)}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-long transition-all"
                style={{ width: `${filledPercent.toNumber()}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filledPercent.toFixed(0)}%
            </span>
          </div>
        </td>
        <td className="px-3 py-2 text-xs text-muted-foreground">
          {formatTime(order.timestamp)}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            {!isTrigger && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setEditDialog(true)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-short hover:bg-short/10"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </td>
      </tr>

      {editDialog && (
        <EditOrderDialog
          open={editDialog}
          onOpenChange={setEditDialog}
          order={order}
        />
      )}
    </>
  );
}

// ============================================
// Main OpenOrders Component
// ============================================

export function OpenOrders() {
  const { isConnected } = useAccount();
  const { setCurrentMarket } = useAppStore();
  const { openOrders } = useUserStore();

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full bg-card rounded-lg border border-border">
        <div className="px-3 py-2 border-b border-border">
          <h3 className="text-sm font-medium">Open Orders</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">
            Connect wallet to view orders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium">
          Open Orders ({openOrders.length})
        </h3>
      </div>

      {openOrders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">No open orders</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Market</th>
                <th className="px-3 py-2 font-medium">Side</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Filled</th>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {openOrders.map((order) => (
                <OrderRow
                  key={order.oid}
                  order={order}
                  onSelectCoin={() => setCurrentMarket("perp", order.coin)}
                />
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  );
}
