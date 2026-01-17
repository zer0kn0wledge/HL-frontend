'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { HypurrLogoCompact } from '@/components/brand/hypurr-logo';
import { ModeNav } from '@/components/layout/ModeNav';
import { ConnectButton } from '@/components/wallet/connect-button';

interface TapHeaderProps {
  isConnected: boolean;
}

export function TapHeader({ isConnected }: TapHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-white/5 bg-black/80 backdrop-blur-sm">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <HypurrLogoCompact />

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Mode Navigation */}
        <ModeNav />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-500'
            }`}
          />
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-yellow-500" />
          )}
          <span className={`text-xs hidden sm:inline ${isConnected ? 'text-green-400' : 'text-yellow-500'}`}>
            {isConnected ? 'Live' : 'Connecting'}
          </span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* Connect Button */}
        <ConnectButton />
      </div>
    </header>
  );
}
