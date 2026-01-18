'use client';

import { useState, useEffect } from 'react';
import { useTapTrading } from '@/hooks/tap/useTapTrading';
import { TapHeader } from './TapHeader';
import { AssetSelector } from './AssetSelector';
import { TapChartGrid } from './TapChartGrid';
import { BetControls } from './BetControls';
import { WinCelebration } from './WinCelebration';
import { TapDepositModal } from './TapDepositModal';
import { GridBox } from '@/lib/tap/types';
import { Wallet } from 'lucide-react';

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
    // Real mode
    tapTradingBalance,
    realBalance,
    depositTapBalance,
  } = useTapTrading();

  // Show deposit modal on first load if in real mode with no balance
  const [showDepositModal, setShowDepositModal] = useState(() => {
    // Check if we should show on mount (real mode with no balance)
    return true; // Will be controlled by useEffect
  });
  const [hasShownInitialModal, setHasShownInitialModal] = useState(false);

  // Show deposit modal on first load or when switching to real mode with no balance
  useEffect(() => {
    if (!isDemoMode && tapTradingBalance === 0 && !hasShownInitialModal) {
      setShowDepositModal(true);
      setHasShownInitialModal(true);
    }
  }, [isDemoMode, tapTradingBalance, hasShownInitialModal]);

  const handleTap = (box: GridBox) => {
    // If in real mode with no balance, show deposit modal
    if (!isDemoMode && tapTradingBalance < betAmount) {
      setShowDepositModal(true);
      return;
    }
    placeBet(box);
  };

  const handleToggleMode = () => {
    // If switching to real mode with no balance, show deposit modal
    if (isDemoMode && tapTradingBalance === 0) {
      setShowDepositModal(true);
    }
    toggleDemoMode();
  };

  const handleDeposit = (amount: number) => {
    depositTapBalance(amount);
    // If we were in demo mode, switch to real mode
    if (isDemoMode) {
      toggleDemoMode();
    }
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
          onClick={handleToggleMode}
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
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-2 py-1.5 rounded-lg text-xs text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 transition-all flex items-center gap-1"
            title="Deposit funds for tap trading"
          >
            <Wallet className="w-3 h-3" />
            {tapTradingBalance > 0 ? `$${tapTradingBalance.toFixed(0)}` : 'Deposit'}
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

        {/* Overlay prompt for real mode with no balance */}
        {!isDemoMode && tapTradingBalance < betAmount && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deposit Funds to Trade</h3>
              <p className="text-gray-400 mb-4 max-w-xs">
                Pre-approve funds to enable instant tap trading without wallet popups.
              </p>
              <button
                onClick={() => setShowDepositModal(true)}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-all"
              >
                Deposit Now
              </button>
              <button
                onClick={toggleDemoMode}
                className="block mx-auto mt-3 text-sm text-gray-500 hover:text-gray-400"
              >
                or continue in demo mode
              </button>
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

      {/* Deposit modal */}
      <TapDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDeposit}
        currentBalance={tapTradingBalance}
      />
    </div>
  );
}
