'use client';

import { memo, useMemo } from 'react';
import { GridBox, TapBet } from '@/lib/tap/types';
import { TIME_LABELS, GRID_CONFIG } from '@/lib/tap/constants';
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

  const timeWindows = GRID_CONFIG.timeWindows;

  if (longBoxes.length === 0 || shortBoxes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Waiting for price data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-3 max-w-4xl mx-auto">
      {/* Time header row */}
      <div
        className="grid gap-1.5 mb-1"
        style={{ gridTemplateColumns: '70px repeat(6, 1fr)' }}
      >
        <div /> {/* Empty cell for price label column */}
        {timeWindows.map((tw) => (
          <div
            key={tw}
            className="text-center text-xs text-gray-500 font-medium py-1"
          >
            {TIME_LABELS[tw] || `${tw}s`}
          </div>
        ))}
      </div>

      {/* LONG section (reversed so furthest price is at top) */}
      {[...longBoxes].reverse().map((row, rowIdx) => (
        <div
          key={`long-row-${rowIdx}`}
          className="grid gap-1.5"
          style={{ gridTemplateColumns: '70px repeat(6, 1fr)' }}
        >
          <div className="flex items-center justify-end pr-2">
            <span className="text-xs font-mono text-green-400 whitespace-nowrap">
              ${row[0]?.price.toLocaleString()}
            </span>
          </div>
          {row.map((box) => (
            <TapBox
              key={box.id}
              box={box}
              bet={getBet(box)}
              onTap={() => onTap(box)}
            />
          ))}
        </div>
      ))}

      {/* Current price divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-[#50E3C2]/50" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-6 py-2 bg-[#50E3C2] text-black text-base font-bold rounded-full shadow-[0_0_30px_rgba(80,227,194,0.6)]">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* SHORT section */}
      {shortBoxes.map((row, rowIdx) => (
        <div
          key={`short-row-${rowIdx}`}
          className="grid gap-1.5"
          style={{ gridTemplateColumns: '70px repeat(6, 1fr)' }}
        >
          <div className="flex items-center justify-end pr-2">
            <span className="text-xs font-mono text-red-400 whitespace-nowrap">
              ${row[0]?.price.toLocaleString()}
            </span>
          </div>
          {row.map((box) => (
            <TapBox
              key={box.id}
              box={box}
              bet={getBet(box)}
              onTap={() => onTap(box)}
            />
          ))}
        </div>
      ))}
    </div>
  );
});
