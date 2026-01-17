'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PricePoint } from '@/lib/tap/types';

interface UsePriceStreamOptions {
  asset: string;
  maxHistory?: number;
}

interface UsePriceStreamReturn {
  currentPrice: number;
  priceHistory: PricePoint[];
  isConnected: boolean;
  error: string | null;
}

export function usePriceStream({
  asset,
  maxHistory = 100,
}: UsePriceStreamOptions): UsePriceStreamReturn {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Connect to Hyperliquid WebSocket
      const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);

        // Subscribe to trades for the asset
        ws.send(JSON.stringify({
          method: 'subscribe',
          subscription: {
            type: 'trades',
            coin: asset,
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.channel === 'trades' && data.data) {
            const trades = Array.isArray(data.data) ? data.data : [data.data];
            const latestTrade = trades[trades.length - 1];

            if (latestTrade && latestTrade.px) {
              const price = parseFloat(latestTrade.px);
              const time = Date.now();

              setCurrentPrice(price);
              setPriceHistory(prev => {
                const newHistory = [...prev, { time, price }];
                return newHistory.slice(-maxHistory);
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    } catch (e) {
      setError('Failed to connect to WebSocket');
      setIsConnected(false);
    }
  }, [asset, maxHistory]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    currentPrice,
    priceHistory,
    isConnected,
    error,
  };
}
