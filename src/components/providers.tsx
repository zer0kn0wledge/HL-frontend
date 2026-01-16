"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider, type State } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { arbitrum } from "@reown/appkit/networks";

import { projectId, wagmiAdapter } from "@/lib/wagmi-config";

// Set up metadata
const metadata = {
  name: "Hyperliquid Builder Frontend",
  description: "Trade on Hyperliquid with builder code integration",
  url: typeof window !== "undefined" ? window.location.origin : "https://hl-trader.app",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [arbitrum],
  defaultNetwork: arbitrum,
  metadata,
  features: {
    analytics: true,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#22c55e",
    "--w3m-border-radius-master": "2px",
  },
});

export function Providers({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
