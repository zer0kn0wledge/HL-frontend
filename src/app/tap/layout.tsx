import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "TapTrade | Zero's Hypurr Terminal",
  description: "Tap to trade - Place quick bets on price movements",
};

export default function TapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {children}
    </div>
  );
}
