"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider, type State } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { arbitrum } from "@reown/appkit/networks";
import { Toaster } from "sonner";

import { projectId, wagmiAdapter } from "@/lib/wagmi-config";
import { HyperliquidProvider } from "./hyperliquid-provider";
import { BUILDER_CONFIG } from "@/lib/constants";

// ============================================
// AppKit Configuration
// ============================================

const metadata = {
  name: BUILDER_CONFIG.name,
  description: "Professional trading terminal for Hyperliquid",
  url: typeof window !== "undefined" ? window.location.origin : "https://hyperterminal.app",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [arbitrum],
  defaultNetwork: arbitrum,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#6366f1",
    "--w3m-border-radius-master": "2px",
  },
});

// ============================================
// Providers Component
// ============================================

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
            retry: 1,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <HyperliquidProvider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              },
              classNames: {
                success: "!border-long/50",
                error: "!border-short/50",
                warning: "!border-yellow-500/50",
                info: "!border-primary/50",
              },
            }}
          />
        </HyperliquidProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Re-export HyperliquidProvider hook
export { useHyperliquid } from "./hyperliquid-provider";
