'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Zap } from 'lucide-react';

const MODES = [
  {
    id: 'terminal',
    label: 'Terminal',
    href: '/',
    icon: LayoutGrid,
    description: 'Pro trading interface',
  },
  {
    id: 'tap',
    label: 'Tap Trade',
    href: '/tap',
    icon: Zap,
    description: 'Quick tap betting',
  },
];

export function ModeNav() {
  const pathname = usePathname();

  const currentMode = MODES.find(m =>
    m.href === '/' ? pathname === '/' : pathname.startsWith(m.href)
  ) || MODES[0];

  return (
    <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-0.5">
      {MODES.map((mode) => {
        const isActive = currentMode.id === mode.id;
        const Icon = mode.icon;

        return (
          <Link
            key={mode.id}
            href={mode.href}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              isActive
                ? 'bg-[#50E3C2] text-black shadow-[0_0_15px_rgba(80,227,194,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{mode.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
