import type { Metadata } from "next";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { Providers } from "@/components/providers";
import { config } from "@/lib/wagmi-config";
import { CursorGlow } from "@/components/ui/cursor-glow";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zero's Hypurr Terminal | DeFi Trading Platform",
  description: "The ultimate DeFi perpetual trading terminal on Hyperliquid with gamification, social features, and advanced analytics",
  keywords: ["Hyperliquid", "trading", "perpetual futures", "DeFi", "crypto", "Hypurr", "terminal"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialState;
  try {
    const headersList = await headers();
    initialState = cookieToInitialState(
      config,
      headersList.get("cookie")
    );
  } catch {
    initialState = undefined;
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-black font-sans text-white antialiased">
        {/* Elite Animated Background */}
        <div className="animated-bg" />
        <div className="grid-overlay" />
        <div className="noise-overlay" />
        <CursorGlow />
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
