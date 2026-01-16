"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        onClick={() => open({ view: "Account" })}
        size="sm"
        className="gap-2 font-mono"
      >
        <div className="h-2 w-2 rounded-full bg-long" />
        {shortenAddress(address)}
        <ChevronDown className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <Button onClick={() => open()} size="sm" className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect
    </Button>
  );
}
