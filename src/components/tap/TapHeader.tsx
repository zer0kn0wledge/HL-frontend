'use client';

import Link from 'next/link';
import { Settings, User, Wifi, WifiOff } from 'lucide-react';

interface TapHeaderProps {
  isConnected: boolean;
}

export function TapHeader({ isConnected }: TapHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/80 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">😺</span>
        <span className="font-bold text-lg">
          <span className="text-white">Tap</span>
          <span className="text-[#50E3C2]">Trade</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400">Offline</span>
            </>
          )}
        </div>

        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-gray-400" />
        </button>

        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <User className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
