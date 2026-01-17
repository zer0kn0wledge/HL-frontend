'use client';

import { useTapTrading } from '@/hooks/tap/useTapTrading';
import { TapHeader } from './TapHeader';
import { AssetSelector } from './AssetSelector';
import { TapChartGrid } from './TapChartGrid';
import { BetControls } from './BetControls';
import { WinCelebration } from './WinCelebration';
import { GridBox } from '@/lib/tap/types';

export function TapTradingView() {
  const {
    asset,
    currentPrice,
    priceHistory,
    betAmount,
    activeBets,
    balance,
    sessionPnL,
    isConnected,
    lastWin,
    placeBet,
    setBetAmount,
    setAsset,
    clearLastWin,
  } = useTapTrading();

  const handleTap = (box: GridBox) => {
    placeBet(box);
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <TapHeader isConnected={isConnected} />

      {/* Asset selector - floating top left */}
      <div className="absolute top-16 left-4 z-30">
        <AssetSelector
          value={asset}
          currentPrice={currentPrice}
          onChange={setAsset}
        />
      </div>

      {/* Main chart + grid area */}
      <div className="flex-1 relative">
        <TapChartGrid
          currentPrice={currentPrice}
          priceHistory={priceHistory}
          asset={asset}
          activeBets={activeBets}
          onTap={handleTap}
        />
      </div>

      {/* Bottom controls */}
      <BetControls
        betAmount={betAmount}
        balance={balance}
        sessionPnL={sessionPnL}
        activeBetsCount={activeBets.length}
        onBetAmountChange={setBetAmount}
      />

      {/* Win celebration overlay */}
      <WinCelebration bet={lastWin} onComplete={clearLastWin} />
    </div>
  );
}
