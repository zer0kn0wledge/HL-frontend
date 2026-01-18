import { GRID_CONFIG, MIN_MULTIPLIER, MAX_MULTIPLIER, PRICE_INCREMENTS } from './constants';
import { GridBox } from './types';

/**
 * Calculate the multiplier for a grid box
 * Based on probability of price hitting target within time window
 *
 * Euphoria-style tap trading:
 * - Closer to current price = easier = lower multiplier (1.1x-1.5x)
 * - Farther from current price = harder = higher multiplier (2x-10x+)
 * - Shorter time window = harder = higher multiplier
 * - Longer time window = easier = lower multiplier
 */
export function calculateMultiplier(
  priceDelta: number,      // Absolute price difference as percentage (0.01 = 1%)
  timeWindow: number,      // Seconds until expiry
  volatility: number = 1   // Market volatility factor (1 = normal)
): number {
  // Convert to basis points for better scaling (0.01% = 1 bp)
  const basisPoints = priceDelta * 10000;

  // Distance factor: exponential curve for higher payouts at distance
  // At 1bp (~$1 for BTC), multiplier base is low
  // At 50bp (~$50 for BTC), multiplier base is high
  const distanceFactor = 1 + Math.pow(basisPoints / 10, 1.3);

  // Time factor: shorter time = harder = higher multiplier
  // 5 seconds is very short (factor ~2), 120 seconds is long (factor ~0.7)
  const timeFactor = 60 / Math.sqrt(timeWindow * 10);

  // Volatility adjustment (higher vol = lower multiplier, easier to hit)
  const volAdjustment = 1 / Math.sqrt(volatility);

  // Calculate raw multiplier
  const raw = distanceFactor * timeFactor * volAdjustment;

  // Clamp to bounds and round to 1 decimal
  return Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, Math.round(raw * 10) / 10));
}

/**
 * Get price increment for an asset
 */
export function getPriceIncrement(asset: string): number {
  return PRICE_INCREMENTS[asset] || PRICE_INCREMENTS.DEFAULT;
}

/**
 * Generate grid boxes for current price
 */
export function generateGridBoxes(
  currentPrice: number,
  asset: string
): { longBoxes: GridBox[][]; shortBoxes: GridBox[][] } {
  const increment = getPriceIncrement(asset);
  const halfRows = GRID_CONFIG.rows / 2;
  const { timeWindows } = GRID_CONFIG;

  // Round current price to nearest increment
  const basePrice = Math.round(currentPrice / increment) * increment;

  const longBoxes: GridBox[][] = [];
  const shortBoxes: GridBox[][] = [];

  // Generate LONG boxes (above current price)
  for (let row = 0; row < halfRows; row++) {
    const rowBoxes: GridBox[] = [];
    const targetPrice = basePrice + ((row + 1) * increment);
    const priceDelta = (targetPrice - currentPrice) / currentPrice;

    for (let col = 0; col < timeWindows.length; col++) {
      const timeWindow = timeWindows[col];
      const multiplier = calculateMultiplier(priceDelta, timeWindow);

      rowBoxes.push({
        id: `long-${row}-${col}`,
        row,
        col,
        price: targetPrice,
        timeWindow,
        multiplier,
        direction: 'long',
      });
    }

    longBoxes.push(rowBoxes);
  }

  // Generate SHORT boxes (below current price)
  for (let row = 0; row < halfRows; row++) {
    const rowBoxes: GridBox[] = [];
    const targetPrice = basePrice - ((row + 1) * increment);
    const priceDelta = (currentPrice - targetPrice) / currentPrice;

    for (let col = 0; col < timeWindows.length; col++) {
      const timeWindow = timeWindows[col];
      const multiplier = calculateMultiplier(priceDelta, timeWindow);

      rowBoxes.push({
        id: `short-${row}-${col}`,
        row,
        col,
        price: targetPrice,
        timeWindow,
        multiplier,
        direction: 'short',
      });
    }

    shortBoxes.push(rowBoxes);
  }

  return { longBoxes, shortBoxes };
}
