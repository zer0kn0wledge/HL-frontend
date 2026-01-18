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

// Smaller increments so price actually moves through rows
const PRICE_INCREMENTS: Record<string, number> = {
  BTC: 2,      // $2 per row
  ETH: 0.2,
  SOL: 0.01,
  DEFAULT: 0.005,
};

const NUM_ROWS = 14;
const NUM_COLS = 10;
const COL_SECONDS = 5;
const TOTAL_TIME_SPAN = NUM_COLS * COL_SECONDS; // 50 seconds total

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

  // FIXED grid anchor - only updates when price moves significantly
  const gridAnchorRef = useRef<number>(0);
  const lastSignificantPriceRef = useRef<number>(0);

  const [priceZoom, setPriceZoom] = useState(1);
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);

  const baseIncrement = PRICE_INCREMENTS[asset] || PRICE_INCREMENTS.DEFAULT;
  const increment = baseIncrement / priceZoom;

  // Update grid anchor only when price moves significantly (more than half the grid)
  useEffect(() => {
    if (!currentPrice) return;

    if (gridAnchorRef.current === 0) {
      // Initialize
      gridAnchorRef.current = Math.round(currentPrice / increment) * increment;
      lastSignificantPriceRef.current = currentPrice;
    } else {
      // Only re-anchor if price moved more than 1/3 of visible range
      const visibleRange = NUM_ROWS * increment;
      const drift = Math.abs(currentPrice - lastSignificantPriceRef.current);
      if (drift > visibleRange * 0.3) {
        gridAnchorRef.current = Math.round(currentPrice / increment) * increment;
        lastSignificantPriceRef.current = currentPrice;
      }
    }
  }, [currentPrice, increment]);

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.002;
    setPriceZoom(prev => Math.max(0.5, Math.min(4, prev * (1 + delta))));
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
      setPriceZoom(Math.max(0.5, Math.min(4, touchRef.current.zoom * scale)));
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

  // Store dimensions for click handling
  const dimsRef = useRef({ chartW: 0, chartH: 0, colW: 0, rowH: 0, topPrice: 0 });

  // Animation loop
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
    const priceAxisWidth = 70;
    const timeAxisHeight = 28;
    const chartW = width - priceAxisWidth;
    const chartH = height - timeAxisHeight;
    const colW = chartW / NUM_COLS;
    const rowH = chartH / NUM_ROWS;

    // Store for click handling
    dimsRef.current = { chartW, chartH, colW, rowH, topPrice: 0 };

    const getMultiplier = (rowDist: number, colIdx: number) => {
      const priceFactor = 1 + Math.pow(rowDist * 0.15, 1.4);
      const timeFactor = 1 + colIdx * 0.06;
      return Math.max(1.05, Math.min(12, priceFactor * timeFactor));
    };

    const draw = () => {
      const now = Date.now();

      if (!currentPrice || currentPrice <= 0 || gridAnchorRef.current <= 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // FIXED price grid centered on anchor
      const anchor = gridAnchorRef.current;
      const halfRows = NUM_ROWS / 2;
      const topPrice = anchor + halfRows * increment;
      const bottomPrice = anchor - halfRows * increment;
      const priceRange = topPrice - bottomPrice;

      dimsRef.current.topPrice = topPrice;

      const priceToY = (p: number) => ((topPrice - p) / priceRange) * chartH;

      // Time flows: now is at 30% from left, future extends right
      const nowFraction = 0.3;
      const nowX = chartW * nowFraction;

      // Time offset - continuous flow
      const timeOffset = (now % (COL_SECONDS * 1000)) / 1000;
      const pxPerSecond = colW / COL_SECONDS;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(0, 0, width, height);

      // Current price Y position (can be anywhere on the grid!)
      const currentPriceY = priceToY(currentPrice);

      // Draw grid - boxes flow with time
      for (let row = 0; row < NUM_ROWS; row++) {
        const rowTopPrice = topPrice - row * increment;
        const rowBottomPrice = rowTopPrice - increment;
        const rowCenterPrice = (rowTopPrice + rowBottomPrice) / 2;
        const y = row * rowH;

        const isAbove = rowCenterPrice > currentPrice;
        const priceDist = Math.abs(rowCenterPrice - currentPrice) / increment;

        for (let col = 0; col < NUM_COLS; col++) {
          // X position flows with time
          const baseX = col * colW;
          const flowOffset = -timeOffset * pxPerSecond;
          const x = baseX + flowOffset;

          // Time this column represents (negative = past, positive = future)
          const colTimeSec = (col - NUM_COLS * nowFraction) * COL_SECONDS - timeOffset;
          const isFuture = colTimeSec > 0;
          const isPast = colTimeSec < -COL_SECONDS;

          // Fade past boxes, keep future visible
          let opacity: number;
          if (isPast) {
            opacity = Math.max(0, 0.15 + colTimeSec / (COL_SECONDS * 2));
          } else if (isFuture) {
            opacity = Math.max(0.4, 1 - (colTimeSec / TOTAL_TIME_SPAN) * 0.4);
          } else {
            opacity = 0.7; // "now" column
          }

          if (opacity < 0.05) continue;

          // Check for active bet
          const bet = activeBets.find(b => {
            const timeLeft = (b.expiresAt - now) / 1000;
            return Math.abs(b.targetPrice - rowCenterPrice) < increment * 0.6 &&
                   Math.abs(timeLeft - colTimeSec) < COL_SECONDS;
          });

          const isActive = bet?.status === 'active';
          const isHovered = hoveredCell?.row === row && hoveredCell?.col === col && isFuture;
          const isCurrentPriceRow = currentPriceY >= y && currentPriceY < y + rowH;

          const multiplier = getMultiplier(priceDist, Math.max(0, col - Math.floor(NUM_COLS * nowFraction)));

          // Colors
          let bgColor: string;
          let borderColor: string;
          let textColor: string;

          if (isActive) {
            bgColor = `rgba(250, 204, 21, ${0.5 * opacity})`;
            borderColor = `rgba(250, 204, 21, ${0.9 * opacity})`;
            textColor = '#000';
          } else if (isCurrentPriceRow && !isPast) {
            bgColor = `rgba(236, 72, 153, ${0.15 * opacity})`;
            borderColor = `rgba(236, 72, 153, ${0.35 * opacity})`;
            textColor = `rgba(236, 72, 153, ${0.9 * opacity})`;
          } else if (isHovered) {
            bgColor = isAbove ? `rgba(34,197,94,${0.3*opacity})` : `rgba(239,68,68,${0.3*opacity})`;
            borderColor = isAbove ? `rgba(34,197,94,${0.6*opacity})` : `rgba(239,68,68,${0.6*opacity})`;
            textColor = isAbove ? `rgba(34,197,94,${opacity})` : `rgba(239,68,68,${opacity})`;
          } else {
            bgColor = isAbove ? `rgba(34,197,94,${0.06*opacity})` : `rgba(239,68,68,${0.06*opacity})`;
            borderColor = isAbove ? `rgba(34,197,94,${0.18*opacity})` : `rgba(239,68,68,${0.18*opacity})`;
            textColor = isAbove ? `rgba(34,197,94,${0.7*opacity})` : `rgba(239,68,68,${0.7*opacity})`;
          }

          // Draw box
          ctx.fillStyle = bgColor;
          ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = isActive ? 2 : 1;
          ctx.strokeRect(x + 1, y + 1, colW - 2, rowH - 2);

          // Multiplier (future only)
          if (isFuture && opacity > 0.3) {
            ctx.fillStyle = textColor;
            ctx.font = `bold 11px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${multiplier.toFixed(2)}X`, x + colW/2, y + rowH/2);

            if (isActive && bet) {
              const secs = Math.ceil((bet.expiresAt - now) / 1000);
              ctx.fillStyle = '#000';
              ctx.font = 'bold 9px monospace';
              ctx.fillText(`${secs}s`, x + colW/2, y + rowH/2 + 12);
            }
          }
        }
      }

      // Draw price line THROUGH the grid
      const visibleHistory = priceHistory
        .filter(p => (now - p.time) < 90000)
        .sort((a, b) => a.time - b.time);

      if (visibleHistory.length >= 1) {
        // Gradient fill
        const grad = ctx.createLinearGradient(0, currentPriceY - 40, 0, currentPriceY + 80);
        grad.addColorStop(0, 'rgba(236,72,153,0.25)');
        grad.addColorStop(0.5, 'rgba(236,72,153,0.1)');
        grad.addColorStop(1, 'rgba(236,72,153,0)');

        ctx.beginPath();
        let started = false;
        visibleHistory.forEach((p) => {
          const age = (now - p.time) / 1000;
          const x = nowX - age * pxPerSecond;
          if (x < -50) return;
          const y = priceToY(p.price);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        });
        ctx.lineTo(nowX, currentPriceY);
        ctx.lineTo(nowX, chartH);
        ctx.lineTo(0, chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Price line
        ctx.beginPath();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 10;

        started = false;
        visibleHistory.forEach((p) => {
          const age = (now - p.time) / 1000;
          const x = nowX - age * pxPerSecond;
          if (x < -50) return;
          const y = priceToY(p.price);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        });
        ctx.lineTo(nowX, currentPriceY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current price dot
        const pulse = 1 + Math.sin(now / 100) * 0.25;
        ctx.beginPath();
        ctx.arc(nowX, currentPriceY, 10 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(236,72,153,0.35)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(nowX, currentPriceY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Horizontal line at price
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(236,72,153,0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(0, currentPriceY);
        ctx.lineTo(chartW, currentPriceY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Y-axis (prices)
      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(chartW, 0, priceAxisWidth, height);

      for (let row = 0; row <= NUM_ROWS; row++) {
        const price = topPrice - row * increment;
        const y = row * rowH;
        const isCurrent = Math.abs(price - currentPrice) < increment * 0.6;

        ctx.fillStyle = isCurrent ? '#ec4899' : '#555';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const str = price >= 1000
          ? `$${price.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}`
          : `$${price.toFixed(2)}`;
        ctx.fillText(str, chartW + 5, y);
      }

      // Current price badge
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(chartW + 2, currentPriceY - 10, priceAxisWidth - 6, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      const priceStr = currentPrice >= 1000
        ? `$${currentPrice.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}`
        : `$${currentPrice.toFixed(2)}`;
      ctx.fillText(priceStr, chartW + priceAxisWidth/2, currentPriceY);

      // X-axis (time)
      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(0, chartH, chartW, timeAxisHeight);

      for (let i = 0; i <= NUM_COLS; i += 2) {
        const secFromNow = (i - NUM_COLS * nowFraction) * COL_SECONDS;
        const x = i * colW - timeOffset * pxPerSecond;
        const t = new Date(now + secFromNow * 1000);
        const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        ctx.fillStyle = Math.abs(secFromNow) < COL_SECONDS ? '#ec4899' : '#444';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, chartH + 16);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentPrice, priceHistory, activeBets, hoveredCell, increment, priceZoom]);

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container || !currentPrice) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { chartW, chartH, colW, rowH, topPrice } = dimsRef.current;
    if (x >= chartW || y >= chartH || topPrice <= 0) return;

    const col = Math.floor(x / colW);
    const row = Math.floor(y / rowH);

    // Only future columns (> 30%)
    const nowCol = Math.floor(NUM_COLS * 0.3);
    if (col <= nowCol || col >= NUM_COLS || row < 0 || row >= NUM_ROWS) return;

    const rowCenterPrice = topPrice - (row + 0.5) * increment;
    const colIdx = col - nowCol;
    const timeWindow = colIdx * COL_SECONDS;
    const priceDist = Math.abs(row - NUM_ROWS / 2);
    const multiplier = Math.max(1.05, Math.min(12, (1 + Math.pow(priceDist * 0.15, 1.4)) * (1 + colIdx * 0.06)));

    const box: GridBox = {
      id: `${row}-${col}-${Date.now()}`,
      row,
      col,
      price: rowCenterPrice,
      timeWindow,
      multiplier,
      direction: rowCenterPrice > currentPrice ? 'long' : 'short',
    };

    console.log('Tapping box:', box);
    onTap(box);
  }, [currentPrice, increment, onTap]);

  // Hover
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { chartW, chartH, colW, rowH } = dimsRef.current;
    if (x >= chartW || y >= chartH) {
      setHoveredCell(null);
      return;
    }

    const col = Math.floor(x / colW);
    const row = Math.floor(y / rowH);
    const nowCol = Math.floor(NUM_COLS * 0.3);

    if (col > nowCol && col < NUM_COLS && row >= 0 && row < NUM_ROWS) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  }, []);

  if (!currentPrice) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0e]">
        <div className="text-gray-500 animate-pulse">Connecting...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0e] overflow-hidden select-none">
      <div className="absolute top-2 right-20 z-10 text-xs bg-black/60 px-2 py-1 rounded flex items-center gap-2">
        <span className="text-gray-500">Zoom</span>
        <span className="text-[#ec4899] font-mono">{priceZoom.toFixed(1)}x</span>
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
