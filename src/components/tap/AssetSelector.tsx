'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
];

interface AssetSelectorProps {
  value: string;
  currentPrice: number;
  onChange: (asset: string) => void;
}

export function AssetSelector({ value, currentPrice, onChange }: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedAsset = ASSETS.find(a => a.symbol === value) || ASSETS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-[#0a0f1a] rounded-xl border border-white/10 hover:border-[#50E3C2]/30 transition-colors"
      >
        <span className="text-[#50E3C2] text-lg">{selectedAsset.icon}</span>
        <div className="text-left">
          <div className="text-xs text-gray-500">{selectedAsset.symbol}</div>
          <motion.div
            key={currentPrice}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="font-mono font-bold text-white"
          >
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </motion.div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-full bg-[#0a0f1a] border border-white/10 rounded-xl overflow-hidden z-50"
          >
            {ASSETS.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => {
                  onChange(asset.symbol);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                  asset.symbol === value ? 'bg-[#50E3C2]/10' : ''
                }`}
              >
                <span className="text-[#50E3C2]">{asset.icon}</span>
                <span className="text-white">{asset.symbol}</span>
                <span className="text-gray-500 text-sm">{asset.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
