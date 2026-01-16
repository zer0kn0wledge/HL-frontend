"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  type IChartApi,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import { useAppStore } from "@/store";
import {
  getCandles,
  subscribeToCandles,
} from "@/lib/hyperliquid";
import type { CandleInterval, ChartCandle, Candle } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Expand,
  Minimize2,
  Settings,
  TrendingUp,
  BarChart2,
  LineChart,
} from "lucide-react";

// ============================================
// Chart Intervals
// ============================================

const INTERVALS: { label: string; value: CandleInterval }[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
];

// ============================================
// Chart Types
// ============================================

type ChartType = "candlestick" | "line" | "area";

// ============================================
// Transform Functions
// ============================================

function transformCandle(candle: Candle): CandlestickData<Time> {
  return {
    time: (candle.t / 1000) as Time,
    open: parseFloat(candle.o),
    high: parseFloat(candle.h),
    low: parseFloat(candle.l),
    close: parseFloat(candle.c),
  };
}

// ============================================
// Chart Component
// ============================================

interface ChartProps {
  className?: string;
}

export function Chart({ className }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  const unsubscribeRef = useRef<{ unsubscribe: () => void } | (() => void) | null>(null);

  const { currentCoin } = useAppStore();
  const [interval, setInterval] = useState<CandleInterval>("15m");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#71717a",
          width: 1,
          style: 2,
          labelBackgroundColor: "#27272a",
        },
        horzLine: {
          color: "#71717a",
          width: 1,
          style: 2,
          labelBackgroundColor: "#27272a",
        },
      },
      rightPriceScale: {
        borderColor: "#27272a",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "#27272a",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Create or update series based on chart type
  const createSeries = useCallback(() => {
    if (!chartRef.current) return null;

    // Remove existing series
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    // Create new series based on type
    switch (chartType) {
      case "candlestick":
        seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
        break;
      case "line":
        seriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: "#3b82f6",
          lineWidth: 2,
        });
        break;
      case "area":
        seriesRef.current = chartRef.current.addSeries(AreaSeries, {
          lineColor: "#3b82f6",
          topColor: "rgba(59, 130, 246, 0.4)",
          bottomColor: "rgba(59, 130, 246, 0.0)",
          lineWidth: 2,
        });
        break;
    }

    return seriesRef.current;
  }, [chartType]);

  // Fetch and subscribe to candle data
  useEffect(() => {
    if (!chartRef.current) return;

    const series = createSeries();
    if (!series) return;

    setIsLoading(true);

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      if (typeof unsubscribeRef.current === "function") {
        unsubscribeRef.current();
      } else {
        unsubscribeRef.current.unsubscribe();
      }
      unsubscribeRef.current = null;
    }

    // Fetch historical candles
    const fetchCandles = async () => {
      try {
        const candles = await getCandles(currentCoin, interval);

        if (chartType === "candlestick") {
          const data = candles.map(transformCandle);
          series.setData(data);
        } else {
          const data = candles.map((c) => ({
            time: (c.t / 1000) as Time,
            value: parseFloat(c.c),
          }));
          series.setData(data);
        }

        // Fit content
        chartRef.current?.timeScale().fitContent();
        setIsLoading(false);

        // Subscribe to real-time updates
        const unsub = await subscribeToCandles(currentCoin, interval, (candle) => {
          if (chartType === "candlestick") {
            series.update(transformCandle(candle));
          } else {
            series.update({
              time: (candle.t / 1000) as Time,
              value: parseFloat(candle.c),
            });
          }
        });

        unsubscribeRef.current = unsub;
      } catch (error) {
        console.error("Failed to fetch candles:", error);
        setIsLoading(false);
      }
    };

    fetchCandles();

    return () => {
      if (unsubscribeRef.current) {
        if (typeof unsubscribeRef.current === "function") {
          unsubscribeRef.current();
        } else {
          unsubscribeRef.current.unsubscribe();
        }
        unsubscribeRef.current = null;
      }
    };
  }, [currentCoin, interval, chartType, createSeries]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current?.parentElement) return;

    if (!isFullscreen) {
      containerRef.current.parentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-lg border border-border", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        {/* Interval Selector */}
        <div className="flex items-center gap-1">
          {INTERVALS.map((int) => (
            <button
              key={int.value}
              onClick={() => setInterval(int.value)}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                interval === int.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {int.label}
            </button>
          ))}
        </div>

        {/* Chart Type & Controls */}
        <div className="flex items-center gap-2">
          {/* Chart Type */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            <button
              onClick={() => setChartType("candlestick")}
              className={cn(
                "p-1.5 rounded transition-colors",
                chartType === "candlestick"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
              title="Candlestick"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("line")}
              className={cn(
                "p-1.5 rounded transition-colors",
                chartType === "line"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
              title="Line"
            >
              <LineChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("area")}
              className={cn(
                "p-1.5 rounded transition-colors",
                chartType === "area"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
              title="Area"
            >
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Expand className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative min-h-0">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm text-muted-foreground">Loading chart...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
