import { GRID_CONFIG, MIN_MULTIPLIER, MAX_MULTIPLIER, PRICE_INCREMENTS } from './constants';
import { GridBox } from './types';

/**
 * Calculate the multiplier for a grid box
 * Higher distance from current price + shorter time = higher multiplier
 */
export function calculateMultiplier(
  priceDelta: number,      // Absolute price difference as percentage
  timeWindow: number,      // Seconds until expiry
  volatility: number = 1   // Market volatility factor (1 = normal)
): number {
  // Base multiplier from price distance (further = higher)
  const priceMultiplier = 1 + (priceDelta * 40);

  // Time factor (shorter time = slightly lower multiplier for same distance)
  const timeFactor = Math.sqrt(timeWindow / 60);

  // Volatility adjustment (higher vol = lower multiplier, easier to hit)
  const volAdjustment = 1 / Math.sqrt(volatility);

  // Calculate raw multiplier
  const raw = priceMultiplier * timeFactor * volAdjustment;

  // Clamp to bounds
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
