import { DataProvider } from "@/components/trading/data-provider";

export default function TradingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DataProvider>{children}</DataProvider>;
}
