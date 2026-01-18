'use client';

import { useTapTrading } from '@/hooks/tap/useTapTrading';
import { TapHeader } from './TapHeader';
import { AssetSelector } from './AssetSelector';
import { TapChartGrid } from './TapChartGrid';
import { BetControls } from './BetControls';
import { WinCelebration } from './WinCelebration';
import { GridBox } from '@/lib/tap/types';
import { Wallet, AlertCircle } from 'lucide-react';

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
    toggleDemoMode,
    resetDemoBalance,
    // Real balance
    realBalance,
    isPlacingOrder,
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

      {/* Mode toggle and balance - floating top right */}
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

        {isDemoMode ? (
          <button
            onClick={resetDemoBalance}
            className="px-2 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-all"
            title="Reset demo balance to $1000"
          >
            Reset
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-green-400" />
            <span className="font-mono font-bold text-green-400">
              ${realBalance.toFixed(2)}
            </span>
            <span className="text-[10px] text-gray-500">HL</span>
          </div>
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

        {/* Overlay for real mode with no balance */}
        {!isDemoMode && realBalance < betAmount && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20">
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Insufficient Balance</h3>
              <p className="text-gray-400 mb-4">
                You need at least ${betAmount} in your Hyperliquid account to place bets.
                Current balance: <span className="text-white font-mono">${realBalance.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Deposit USDC to your Hyperliquid perps account to start trading.
              </p>
              <button
                onClick={toggleDemoMode}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all"
              >
                Try Demo Mode Instead
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay when placing order */}
        {isPlacingOrder && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
            <div className="text-center p-6">
              <div className="w-12 h-12 border-4 border-[#ec4899]/30 border-t-[#ec4899] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Placing order on Hyperliquid...</p>
              <p className="text-gray-400 text-sm mt-1">Please confirm in your wallet</p>
            </div>
          </div>
        )}
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
