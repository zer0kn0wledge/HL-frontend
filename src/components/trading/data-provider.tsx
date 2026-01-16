"use client";

// This component is no longer needed as HyperliquidProvider handles all data fetching
// Keeping for backwards compatibility but it's essentially a passthrough
export function DataProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
