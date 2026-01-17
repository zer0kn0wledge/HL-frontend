'use client';

import { useTapTrading } from '@/hooks/tap/useTapTrading';
import { TapHeader } from './TapHeader';
import { AssetSelector } from './AssetSelector';
import { PriceLineChart } from './PriceLineChart';
import { TapGrid } from './TapGrid';
import { BetControls } from './BetControls';
import { WinCelebration } from './WinCelebration';

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
    gridBoxes,
    lastWin,
    placeBet,
    setBetAmount,
    setAsset,
    clearLastWin,
  } = useTapTrading();

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <TapHeader isConnected={isConnected} />

      {/* Asset selector and chart */}
      <div className="p-4 space-y-3">
        <AssetSelector
          value={asset}
          currentPrice={currentPrice}
          onChange={setAsset}
        />

        <PriceLineChart
          priceHistory={priceHistory}
          currentPrice={currentPrice}
          activeBets={activeBets}
        />
      </div>

      {/* Tap Grid */}
      <div className="flex-1 overflow-auto">
        <TapGrid
          longBoxes={gridBoxes.longBoxes}
          shortBoxes={gridBoxes.shortBoxes}
          activeBets={activeBets}
          currentPrice={currentPrice}
          onTap={placeBet}
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
