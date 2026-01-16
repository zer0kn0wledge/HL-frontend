"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useTradingStore } from "@/store/trading-store";
import { useApproveBuilderFee } from "@/hooks/use-hyperliquid";
import { BUILDER_ADDRESS, MAX_BUILDER_FEE_RATE } from "@/lib/constants";
import { shortenAddress } from "@/lib/utils";
import { Shield, Check } from "lucide-react";

export function BuilderApprovalModal() {
  const showModal = useTradingStore((s) => s.showBuilderApprovalModal);
  const setShowModal = useTradingStore((s) => s.setShowBuilderApprovalModal);

  const approveBuilderMutation = useApproveBuilderFee();

  const handleApprove = async () => {
    try {
      await approveBuilderMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to approve builder fee:", error);
    }
  };

  return (
    <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      title="Approve Builder Fee"
    >
      <div className="space-y-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Description */}
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-white">
            One-Time Approval Required
          </h3>
          <p className="text-sm text-zinc-400">
            To trade through this interface, you need to approve a small builder fee.
            This is a one-time signature that enables order routing.
          </p>
        </div>

        {/* Fee Details */}
        <div className="space-y-2 rounded-lg bg-zinc-800 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Builder Address</span>
            <span className="font-mono text-white">
              {shortenAddress(BUILDER_ADDRESS, 6)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Max Fee Rate</span>
            <span className="text-white">{MAX_BUILDER_FEE_RATE}</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">What you get:</p>
          <div className="space-y-1">
            {[
              "Access to advanced trading features",
              "Real-time order execution",
              "Portfolio tracking & analytics",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="h-4 w-4 text-green-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleApprove}
            isLoading={approveBuilderMutation.isPending}
          >
            Approve & Continue
          </Button>
        </div>

        {approveBuilderMutation.isError && (
          <p className="text-center text-xs text-red-500">
            {(approveBuilderMutation.error as Error)?.message || "Failed to approve"}
          </p>
        )}
      </div>
    </Modal>
  );
}
