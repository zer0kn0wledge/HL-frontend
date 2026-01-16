import type { Metadata } from "next";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { Providers } from "@/components/providers";
import { config } from "@/lib/wagmi-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "HL Trader | Hyperliquid Trading Frontend",
  description: "Trade perpetual futures on Hyperliquid with builder code integration",
  keywords: ["Hyperliquid", "trading", "perpetual futures", "DeFi", "crypto"],
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
      <body className="bg-zinc-950 font-sans text-white antialiased">
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
