"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils";

export function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  if (isConnected && address) {
    return (
      <Button variant="secondary" onClick={() => open({ view: "Account" })} size="sm">
        {shortenAddress(address)}
      </Button>
    );
  }

  return (
    <Button variant="primary" onClick={() => open()} size="sm">
      Connect Wallet
    </Button>
  );
}
