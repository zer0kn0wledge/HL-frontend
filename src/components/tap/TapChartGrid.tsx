'use client';

import { memo, useRef, useEffect, useCallback, useState } from 'react';
import { GridBox, TapBet, PricePoint } from '@/lib/tap/types';

interface TapChartGridProps {
  currentPrice: number;
  priceHistory: PricePoint[];
  asset: string;
  activeBets: TapBet[];
  onTap: (box: GridBox) => void;
}

// VERY small increments so price visibly moves through MANY rows
// BTC volatility is ~$10-50 per minute, so $0.50 per row = 20-100 rows of movement!
const PRICE_INCREMENTS: Record<string, number> = {
  BTC: 0.5,     // $0.50 per row - makes line move dramatically
  ETH: 0.05,    // $0.05 per row
  SOL: 0.002,   // $0.002 per row
  DEFAULT: 0.001,
};

const NUM_ROWS = 30;        // Many rows for dramatic movement
const NUM_COLS = 6;         // Fewer columns
const COL_SECONDS = 5;      // 5 seconds per column
const HISTORY_SECONDS = 10; // Show 10 seconds of history
const FUTURE_SECONDS = 20;  // Show 20 seconds into future

export const TapChartGrid = memo(function TapChartGrid({
  currentPrice,
  priceHistory,
  asset,
  activeBets,
  onTap,
}: TapChartGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [priceZoom, setPriceZoom] = useState(1);
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);

  const baseIncrement = PRICE_INCREMENTS[asset] || PRICE_INCREMENTS.DEFAULT;
  const increment = baseIncrement / priceZoom;

  // Store dimensions and computed values for click handling
  const dimsRef = useRef({
    chartW: 0,
    chartH: 0,
    colW: 0,
    rowH: 0,
    topPrice: 0,
    nowX: 0,
    pxPerSecond: 0,
  });

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.002;
    setPriceZoom(prev => Math.max(0.3, Math.min(5, prev * (1 + delta))));
  }, []);

  // Touch zoom
  const touchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchRef.current = { distance, zoom: priceZoom };
    }
  }, [priceZoom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / touchRef.current.distance;
      setPriceZoom(Math.max(0.3, Math.min(5, touchRef.current.zoom * scale)));
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove]);

  // Animation loop - PERPETUAL SMOOTH FLOW
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const priceAxisWidth = 80;
    const timeAxisHeight = 30;
    const chartW = width - priceAxisWidth;
    const chartH = height - timeAxisHeight;
    const colW = chartW / NUM_COLS;
    const rowH = chartH / NUM_ROWS;

    // Time positioning
    const totalSeconds = HISTORY_SECONDS + FUTURE_SECONDS;
    const pxPerSecond = chartW / totalSeconds;
    const nowX = HISTORY_SECONDS * pxPerSecond; // "Now" line position

    // Store for click handling
    dimsRef.current = { chartW, chartH, colW, rowH, topPrice: 0, nowX, pxPerSecond };

    const getMultiplier = (priceDist: number, timeSec: number) => {
      // Higher multiplier for further price distance and shorter time
      // priceDist is in number of rows from current price
      // With $0.50 increments, 10 rows = $5 move needed

      // Base multiplier increases exponentially with distance
      // 1 row = 1.1x, 5 rows = 1.5x, 10 rows = 2.5x, 20 rows = 5x+
      const priceFactor = 1 + Math.pow(priceDist * 0.08, 1.5);

      // Time factor: shorter time = higher multiplier (harder to hit)
      // Longer time = lower multiplier (easier to wait for target)
      const timeFactor = Math.max(0.8, 1.5 - (timeSec / FUTURE_SECONDS) * 0.7);

      return Math.max(1.1, Math.min(25, priceFactor * timeFactor));
    };

    const draw = () => {
      const now = Date.now();

      if (!currentPrice || currentPrice <= 0) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0a0a0e';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Connecting to price feed...', width / 2, height / 2);
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // PERPETUAL SMOOTH SCROLLING:
      // Grid follows current price with sub-pixel precision
      // The fractional part of (price/increment) determines vertical offset
      const priceInIncrements = currentPrice / increment;
      const gridOffset = (priceInIncrements % 1) * rowH; // Sub-pixel offset for smooth scrolling

      // Calculate price range centered on current price
      const halfRows = NUM_ROWS / 2;
      const centerRowPrice = Math.floor(priceInIncrements) * increment;
      const topPrice = centerRowPrice + halfRows * increment;
      const bottomPrice = centerRowPrice - halfRows * increment;
      const priceRange = topPrice - bottomPrice;

      dimsRef.current.topPrice = topPrice;

      // Price to Y with smooth offset
      const priceToY = (p: number) => {
        const baseY = ((topPrice - p) / priceRange) * chartH;
        return baseY + gridOffset; // Add smooth offset
      };

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(0, 0, width, height);

      // Current price Y (with smooth offset, should be near center)
      const currentPriceY = priceToY(currentPrice);

      // Time offset for smooth box flow
      const timeOffset = (now % (COL_SECONDS * 1000)) / 1000;

      // Draw grid boxes
      for (let row = -2; row < NUM_ROWS + 2; row++) {
        const rowPrice = topPrice - row * increment;
        const y = row * rowH + gridOffset;

        // Skip if off screen
        if (y + rowH < 0 || y > chartH) continue;

        const isAbove = rowPrice > currentPrice;
        const priceDist = Math.abs(rowPrice - currentPrice) / increment;

        // Draw boxes for each time column
        for (let colIdx = 0; colIdx < NUM_COLS + 2; colIdx++) {
          // Time in seconds from now for this column
          const colBaseTime = -HISTORY_SECONDS + colIdx * COL_SECONDS;
          const colTime = colBaseTime - timeOffset; // Smooth time flow

          // X position
          const x = nowX + colTime * pxPerSecond;

          // Skip if off screen
          if (x + colW < 0 || x > chartW) continue;

          const isFuture = colTime > 0;
          const isPast = colTime < -COL_SECONDS;
          const isNearNow = Math.abs(colTime) < COL_SECONDS;

          // Opacity: fade past, full future, highlight now
          let opacity: number;
          if (isPast) {
            // Fade out in the past
            const pastAge = Math.abs(colTime) / HISTORY_SECONDS;
            opacity = Math.max(0.05, 0.4 - pastAge * 0.35);
          } else if (isNearNow) {
            opacity = 0.6;
          } else {
            // Future - slightly fade distant future
            const futureAge = colTime / FUTURE_SECONDS;
            opacity = Math.max(0.5, 0.9 - futureAge * 0.3);
          }

          if (opacity < 0.03) continue;

          // Check for active bet in this cell
          const bet = activeBets.find(b => {
            const betTimeLeft = (b.expiresAt - now) / 1000;
            const priceMatch = Math.abs(b.targetPrice - rowPrice) < increment * 0.6;
            const timeMatch = Math.abs(betTimeLeft - colTime) < COL_SECONDS * 0.8;
            return priceMatch && timeMatch && b.status === 'active';
          });

          const isActive = !!bet;
          const isHovered = hoveredCell?.row === row && hoveredCell?.col === colIdx && isFuture;
          const isCurrentPriceRow = Math.abs(rowPrice - currentPrice) < increment * 0.6;

          const multiplier = getMultiplier(priceDist, Math.max(0, colTime));

          // Colors
          let bgColor: string;
          let borderColor: string;
          let textColor: string;

          if (isActive) {
            // Active bet - golden glow
            bgColor = `rgba(250, 204, 21, ${0.6 * opacity})`;
            borderColor = `rgba(250, 204, 21, ${opacity})`;
            textColor = '#000';
          } else if (isCurrentPriceRow && !isPast) {
            // Current price row - pink highlight
            bgColor = `rgba(236, 72, 153, ${0.12 * opacity})`;
            borderColor = `rgba(236, 72, 153, ${0.4 * opacity})`;
            textColor = `rgba(236, 72, 153, ${0.9 * opacity})`;
          } else if (isHovered) {
            // Hovered - brighter
            bgColor = isAbove ? `rgba(34,197,94,${0.35*opacity})` : `rgba(239,68,68,${0.35*opacity})`;
            borderColor = isAbove ? `rgba(34,197,94,${0.7*opacity})` : `rgba(239,68,68,${0.7*opacity})`;
            textColor = isAbove ? `rgba(34,197,94,${opacity})` : `rgba(239,68,68,${opacity})`;
          } else {
            // Default - subtle
            bgColor = isAbove ? `rgba(34,197,94,${0.05*opacity})` : `rgba(239,68,68,${0.05*opacity})`;
            borderColor = isAbove ? `rgba(34,197,94,${0.15*opacity})` : `rgba(239,68,68,${0.15*opacity})`;
            textColor = isAbove ? `rgba(34,197,94,${0.65*opacity})` : `rgba(239,68,68,${0.65*opacity})`;
          }

          // Draw box
          const boxX = Math.max(0, x);
          const boxW = Math.min(colW - 2, chartW - boxX - 1);
          const boxY = Math.max(0, y);
          const boxH = Math.min(rowH - 2, chartH - boxY - 1);

          if (boxW > 0 && boxH > 0) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(boxX + 1, boxY + 1, boxW, boxH);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = isActive ? 2.5 : 1;
            ctx.strokeRect(boxX + 1, boxY + 1, boxW, boxH);

            // Multiplier text (future only, enough space)
            if (isFuture && opacity > 0.35 && boxW > 40 && boxH > 25) {
              ctx.fillStyle = textColor;
              ctx.font = 'bold 11px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${multiplier.toFixed(2)}x`, boxX + boxW/2, boxY + boxH/2);

              // Countdown for active bets
              if (isActive && bet) {
                const secs = Math.max(0, Math.ceil((bet.expiresAt - now) / 1000));
                ctx.fillStyle = '#000';
                ctx.font = 'bold 9px monospace';
                ctx.fillText(`${secs}s`, boxX + boxW/2, boxY + boxH/2 + 12);
              }
            }
          }
        }
      }

      // Draw "NOW" vertical line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.moveTo(nowX, 0);
      ctx.lineTo(nowX, chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw price history line
      const visibleHistory = priceHistory
        .filter(p => (now - p.time) < HISTORY_SECONDS * 1000 + 5000)
        .sort((a, b) => a.time - b.time);

      if (visibleHistory.length >= 2) {
        // Gradient fill under the line
        const grad = ctx.createLinearGradient(0, currentPriceY - 50, 0, currentPriceY + 100);
        grad.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
        grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.1)');
        grad.addColorStop(1, 'rgba(236, 72, 153, 0)');

        ctx.beginPath();
        let started = false;
        visibleHistory.forEach((p) => {
          const age = (now - p.time) / 1000;
          const x = nowX - age * pxPerSecond;
          if (x < -20) return;
          const y = priceToY(p.price);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        });
        // Close the fill area
        ctx.lineTo(nowX, currentPriceY);
        ctx.lineTo(nowX, chartH);
        const firstX = nowX - ((now - visibleHistory[0].time) / 1000) * pxPerSecond;
        ctx.lineTo(Math.max(0, firstX), chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw the actual price line
        ctx.beginPath();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 12;

        started = false;
        visibleHistory.forEach((p) => {
          const age = (now - p.time) / 1000;
          const x = nowX - age * pxPerSecond;
          if (x < -20) return;
          const y = priceToY(p.price);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        });
        ctx.lineTo(nowX, currentPriceY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Current price dot with pulsing animation
      const pulse = 1 + Math.sin(now / 120) * 0.3;
      ctx.beginPath();
      ctx.arc(nowX, currentPriceY, 12 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(nowX, currentPriceY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Horizontal price line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(0, currentPriceY);
      ctx.lineTo(chartW, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Y-axis (prices)
      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(chartW, 0, priceAxisWidth, height);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartW, 0);
      ctx.lineTo(chartW, chartH);
      ctx.stroke();

      // Price labels
      for (let row = 0; row <= NUM_ROWS; row++) {
        const price = topPrice - row * increment;
        const y = row * rowH + gridOffset;
        if (y < 0 || y > chartH) continue;

        const isCurrent = Math.abs(price - currentPrice) < increment * 0.5;

        ctx.fillStyle = isCurrent ? '#ec4899' : '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const priceStr = price >= 1000
          ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : `$${price.toFixed(2)}`;
        ctx.fillText(priceStr, chartW + 8, y);
      }

      // Current price badge
      const badgeY = Math.max(12, Math.min(chartH - 12, currentPriceY));
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(chartW + 3, badgeY - 11, priceAxisWidth - 8, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const currentPriceStr = currentPrice >= 1000
        ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${currentPrice.toFixed(2)}`;
      ctx.fillText(currentPriceStr, chartW + priceAxisWidth / 2, badgeY);

      // X-axis (time labels)
      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(0, chartH, chartW, timeAxisHeight);
      ctx.strokeStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(0, chartH);
      ctx.lineTo(chartW, chartH);
      ctx.stroke();

      // Time labels
      const timeLabels = [-15, -10, -5, 0, 5, 10, 15, 20, 25];
      timeLabels.forEach(sec => {
        const x = nowX + sec * pxPerSecond;
        if (x < 0 || x > chartW) return;

        ctx.fillStyle = sec === 0 ? '#ec4899' : '#555';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        if (sec === 0) {
          ctx.fillText('NOW', x, chartH + 8);
        } else if (sec < 0) {
          ctx.fillText(`${sec}s`, x, chartH + 8);
        } else {
          ctx.fillText(`+${sec}s`, x, chartH + 8);
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentPrice, priceHistory, activeBets, hoveredCell, increment, priceZoom]);

  // Click handler - place bet on tapped box
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container || !currentPrice) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { chartW, chartH, nowX, pxPerSecond, topPrice } = dimsRef.current;
    if (clickX >= chartW || clickY >= chartH || topPrice <= 0) return;

    // Calculate which time this click corresponds to
    const clickTimeSec = (clickX - nowX) / pxPerSecond;

    // Only allow clicks in the future (right of NOW line)
    if (clickTimeSec < 1) {
      console.log('Click in past/now area - ignoring');
      return;
    }

    // Calculate grid offset for price calculation
    const priceInIncrements = currentPrice / increment;
    const gridOffset = (priceInIncrements % 1) * (chartH / NUM_ROWS);

    // Calculate price at click Y
    const adjustedY = clickY - gridOffset;
    const rowIndex = Math.floor(adjustedY / (chartH / NUM_ROWS));
    const clickPrice = topPrice - rowIndex * increment;

    // Determine direction
    const direction = clickPrice > currentPrice ? 'long' : 'short';

    // Calculate multiplier
    const priceDist = Math.abs(clickPrice - currentPrice) / increment;
    const multiplier = Math.max(1.05, Math.min(15, (1 + Math.pow(priceDist * 0.12, 1.3)) * (1 + (clickTimeSec / FUTURE_SECONDS) * 0.5)));

    const box: GridBox = {
      id: `${rowIndex}-${Math.floor(clickTimeSec / COL_SECONDS)}-${Date.now()}`,
      row: rowIndex,
      col: Math.floor(clickTimeSec / COL_SECONDS),
      price: clickPrice,
      timeWindow: Math.ceil(clickTimeSec),
      multiplier,
      direction,
    };

    console.log('Tapping box:', box, { clickTimeSec, clickPrice, currentPrice, direction });
    onTap(box);
  }, [currentPrice, increment, onTap]);

  // Hover handler
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container || !currentPrice) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { chartW, chartH, nowX, pxPerSecond } = dimsRef.current;
    if (x >= chartW || y >= chartH) {
      setHoveredCell(null);
      return;
    }

    const clickTimeSec = (x - nowX) / pxPerSecond;
    if (clickTimeSec < 1) {
      setHoveredCell(null);
      return;
    }

    const row = Math.floor(y / (chartH / NUM_ROWS));
    const col = Math.floor(clickTimeSec / COL_SECONDS);

    if (row >= 0 && row < NUM_ROWS && col >= 0) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  }, [currentPrice]);

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0e]">
        <div className="text-gray-500 animate-pulse">Connecting to price feed...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0e] overflow-hidden select-none">
      {/* Zoom indicator */}
      <div className="absolute top-3 right-24 z-10 text-xs bg-black/70 px-2 py-1 rounded flex items-center gap-2 border border-white/10">
        <span className="text-gray-400">Zoom</span>
        <span className="text-[#ec4899] font-mono font-bold">{priceZoom.toFixed(1)}x</span>
      </div>

      {/* Instructions */}
      <div className="absolute top-3 left-4 z-10 text-xs text-gray-500">
        Tap a box on the right to bet on price direction
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoveredCell(null)}
      />
    </div>
  );
});
