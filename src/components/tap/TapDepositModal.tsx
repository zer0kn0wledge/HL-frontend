'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Zap, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAccount } from 'wagmi';

interface TapDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
  currentBalance: number;
}

const PRESET_AMOUNTS = [50, 100, 250, 500];

export function TapDepositModal({
  isOpen,
  onClose,
  onDeposit,
  currentBalance,
}: TapDepositModalProps) {
  const [amount, setAmount] = useState(100);
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { isConnected, address } = useAccount();

  const handleDeposit = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (amount < 10) {
      setError('Minimum deposit is $10');
      return;
    }

    if (amount > 10000) {
      setError('Maximum deposit is $10,000');
      return;
    }

    setIsDepositing(true);
    setError(null);

    try {
      // Simulate deposit process
      // In production, this would:
      // 1. Transfer USDC from wallet to tap trading contract
      // 2. Lock funds for instant tap trading
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
      onDeposit(amount);

      // Auto close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Failed to deposit. Please try again.');
      console.error('Deposit error:', err);
    } finally {
      setIsDepositing(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setAmount(100);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0a0a0e] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ec4899]/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#ec4899]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Tap Trading Deposit</h2>
                    <p className="text-xs text-gray-400">Allocate funds for instant trading</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Info box */}
                <div className="bg-[#ec4899]/10 border border-[#ec4899]/20 rounded-xl p-3">
                  <p className="text-sm text-[#ec4899]">
                    Allocate funds to enable instant tap trading.
                    Tap boxes to bet on price direction and win multiplied returns!
                  </p>
                </div>

                {/* Connected wallet */}
                {isConnected && address && (
                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Connected</span>
                    </div>
                    <span className="font-mono text-sm text-green-400">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  </div>
                )}

                {/* Current tap trading balance */}
                {currentBalance > 0 && (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Current Tap Balance</span>
                    </div>
                    <span className="font-mono font-bold text-green-400">
                      ${currentBalance.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Amount input */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Deposit Amount (USDC)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-xl font-mono font-bold text-white focus:outline-none focus:border-[#ec4899]/50 focus:ring-1 focus:ring-[#ec4899]/50"
                      min={10}
                      max={10000}
                    />
                  </div>
                </div>

                {/* Preset amounts */}
                <div className="flex gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        amount === preset
                          ? 'bg-[#ec4899] text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                {/* Note about simulation */}
                <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-400">
                    Tap trading uses simulated execution. Your deposited balance tracks wins/losses
                    based on real BTC price movements. Full Hyperliquid integration coming soon!
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">{error}</span>
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">
                      Successfully allocated ${amount} for tap trading!
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing || success || !isConnected || amount < 10}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                    isDepositing || success || !isConnected || amount < 10
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-[#ec4899] hover:bg-[#ec4899]/90 shadow-lg shadow-[#ec4899]/20'
                  }`}
                >
                  {isDepositing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Allocating...
                    </span>
                  ) : success ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Done!
                    </span>
                  ) : !isConnected ? (
                    'Connect Wallet First'
                  ) : (
                    `Allocate $${amount} for Tap Trading`
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Balance persists locally. Wins and losses are tracked against real price.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
