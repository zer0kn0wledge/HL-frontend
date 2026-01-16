"use client";

import { useState, useCallback } from "react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import { Shield, Check, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore } from "@/store";
import { BUILDER_CONFIG } from "@/lib/constants";
import { createExchangeClient, approveBuilderFee } from "@/lib/hyperliquid";

function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function BuilderApprovalModal() {
  const { showBuilderApprovalModal, setShowBuilderApprovalModal, setBuilderApproved } =
    useAppStore();
  const { data: walletClient } = useWalletClient();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = useCallback(async () => {
    if (!walletClient) return;

    setIsApproving(true);
    setError(null);
    try {
      const exchangeClient = createExchangeClient(walletClient);
      await approveBuilderFee(exchangeClient);
      setBuilderApproved(true);
      setShowBuilderApprovalModal(false);
      toast.success("Builder fee approved successfully");
    } catch (err) {
      console.error("Failed to approve builder fee:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to approve builder fee";

      // Check for common errors and provide helpful messages
      if (errorMessage.toLowerCase().includes("insufficient balance")) {
        setError("The builder wallet needs to be set up on Hyperliquid. This is a configuration issue - trading may still work without builder fees.");
      } else if (errorMessage.toLowerCase().includes("rejected")) {
        setError("Transaction was rejected. Please try again.");
      } else {
        setError(errorMessage);
      }
      toast.error(errorMessage);
    } finally {
      setIsApproving(false);
    }
  }, [walletClient, setBuilderApproved, setShowBuilderApprovalModal]);

  const handleSkip = useCallback(() => {
    // Allow users to skip and try trading without builder approval
    setShowBuilderApprovalModal(false);
    toast.info("You can trade on Hyperliquid directly without builder fees.");
  }, [setShowBuilderApprovalModal]);

  return (
    <Dialog
      open={showBuilderApprovalModal}
      onOpenChange={setShowBuilderApprovalModal}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">
            One-Time Approval Required
          </DialogTitle>
          <DialogDescription className="text-center">
            To trade through {BUILDER_CONFIG.name}, you need to approve a small
            builder fee. This is a one-time signature that enables order routing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fee Details */}
          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Builder Address</span>
              <span className="font-mono">
                {shortenAddress(BUILDER_CONFIG.address, 6)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Max Fee Rate</span>
              <span>{BUILDER_CONFIG.maxFeeRate}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              What you get:
            </p>
            <div className="space-y-1">
              {[
                "Access to advanced trading features",
                "Real-time order execution",
                "Portfolio tracking & analytics",
                "Ultra-low trading fees",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 text-sm"
                >
                  <Check className="h-4 w-4 text-long" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
            >
              Skip for Now
            </Button>
            <Button className="flex-1" onClick={handleApprove} disabled={isApproving}>
              {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve & Continue
            </Button>
          </div>

          {/* Direct Trading Link */}
          <a
            href="https://app.hyperliquid.xyz/trade"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Trade directly on Hyperliquid
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
