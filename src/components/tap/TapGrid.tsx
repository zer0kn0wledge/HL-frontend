'use client';

import { memo, useMemo } from 'react';
import { GridBox, TapBet } from '@/lib/tap/types';
import { TIME_LABELS } from '@/lib/tap/constants';
import { TapBox } from './TapBox';

interface TapGridProps {
  longBoxes: GridBox[][];
  shortBoxes: GridBox[][];
  activeBets: TapBet[];
  currentPrice: number;
  onTap: (box: GridBox) => void;
}

export const TapGrid = memo(function TapGrid({
  longBoxes,
  shortBoxes,
  activeBets,
  currentPrice,
  onTap,
}: TapGridProps) {
  // Create a map of bets by target price and direction for quick lookup
  const betMap = useMemo(() => {
    const map = new Map<string, TapBet>();
    activeBets.forEach(bet => {
      const key = `${bet.direction}-${bet.targetPrice}`;
      map.set(key, bet);
    });
    return map;
  }, [activeBets]);

  const getBet = (box: GridBox) => {
    const key = `${box.direction}-${box.price}`;
    return betMap.get(key);
  };

  // Get time windows from first row
  const timeWindows = longBoxes[0]?.map(box => box.timeWindow) || [];

  if (longBoxes.length === 0 || shortBoxes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Waiting for price data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 p-2">
      {/* Time header */}
      <div className="flex gap-1 mb-2 pl-16">
        {timeWindows.map((tw) => (
          <div
            key={tw}
            className="flex-1 text-center text-xs text-gray-500 font-medium"
          >
            {TIME_LABELS[tw] || `${tw}s`}
          </div>
        ))}
      </div>

      {/* LONG section (reversed so furthest price is at top) */}
      <div className="flex flex-col gap-1">
        {[...longBoxes].reverse().map((row, rowIdx) => (
          <div key={`long-row-${rowIdx}`} className="flex items-center gap-1">
            {/* Price label */}
            <div className="w-14 text-right pr-2">
              <span className="text-xs font-mono text-green-400">
                +${row[0]?.price.toLocaleString()}
              </span>
            </div>

            {/* Boxes */}
            {row.map((box) => (
              <div key={box.id} className="flex-1">
                <TapBox
                  box={box}
                  bet={getBet(box)}
                  onTap={() => onTap(box)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Current price divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#50E3C2]/40" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 py-1 bg-[#50E3C2] text-black text-sm font-bold rounded-full shadow-[0_0_20px_rgba(80,227,194,0.5)]">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* SHORT section */}
      <div className="flex flex-col gap-1">
        {shortBoxes.map((row, rowIdx) => (
          <div key={`short-row-${rowIdx}`} className="flex items-center gap-1">
            {/* Price label */}
            <div className="w-14 text-right pr-2">
              <span className="text-xs font-mono text-red-400">
                -${row[0]?.price.toLocaleString()}
              </span>
            </div>

            {/* Boxes */}
            {row.map((box) => (
              <div key={box.id} className="flex-1">
                <TapBox
                  box={box}
                  bet={getBet(box)}
                  onTap={() => onTap(box)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
