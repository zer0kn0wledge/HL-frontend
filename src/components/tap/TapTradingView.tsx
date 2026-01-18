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
    // Demo mode
    isDemoMode,
    demoBalance,
    toggleDemoMode,
    resetDemoBalance,
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

      {/* Demo mode toggle - floating top right */}
      <div className="absolute top-16 right-4 z-30 flex items-center gap-2">
        <button
          onClick={toggleDemoMode}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isDemoMode
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              : 'bg-green-500/20 text-green-400 border border-green-500/50'
          }`}
        >
          {isDemoMode ? '🎮 DEMO' : '💰 REAL'}
        </button>
        {isDemoMode && (
          <button
            onClick={resetDemoBalance}
            className="px-2 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-all"
            title="Reset demo balance to $1000"
          >
            Reset
          </button>
        )}
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
        isDemoMode={isDemoMode}
      />

      {/* Win celebration overlay */}
      <WinCelebration bet={lastWin} onComplete={clearLastWin} />
    </div>
  );
}
