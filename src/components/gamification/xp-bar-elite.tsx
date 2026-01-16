"use client";

import { cn } from "@/lib/utils";

// ============================================
// XP Bar Elite Props
// ============================================
interface XPBarEliteProps {
  level: number;
  currentXP: number;
  requiredXP: number;
  rank?: string;
  prestige?: number;
  className?: string;
}

// ============================================
// XP Bar Elite Component
// ============================================
export function XPBarElite({
  level,
  currentXP,
  requiredXP,
  rank = "Trader",
  prestige = 0,
  className,
}: XPBarEliteProps) {
  const progress = (currentXP / requiredXP) * 100;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-4">
        {/* Level Badge with Circular Progress */}
        <div className="relative group cursor-pointer">
          {/* SVG Ring */}
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            {/* Background ring */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(168, 85, 247, 0.2)"
              strokeWidth="4"
            />
            {/* Progress ring */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#xp-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="xp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#50E3C2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Level number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">
              {level}
            </span>
          </div>

          {/* Prestige stars */}
          {prestige > 0 && (
            <div className="absolute -top-1 -right-1 flex">
              {Array.from({ length: Math.min(prestige, 5) }).map((_, i) => (
                <span
                  key={i}
                  className="text-xs"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  ⭐
                </span>
              ))}
            </div>
          )}

          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity neon-glow-purple" />
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-white truncate">{rank}</span>
            <span className="text-sm text-purple-400">Level {level}</span>
          </div>

          {/* XP Bar */}
          <div className="relative h-3 bg-[#1f2937] rounded-full overflow-hidden">
            {/* Glow background */}
            <div
              className="absolute inset-0 blur-sm opacity-50"
              style={{
                background: `linear-gradient(90deg, rgba(168, 85, 247, 0.5) 0%, rgba(80, 227, 194, 0.5) ${progress}%, transparent ${progress}%)`,
              }}
            />

            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-[#50E3C2] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />

            {/* Shimmer effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{ width: "50%" }}
            />
          </div>

          {/* XP text */}
          <div className="flex justify-between mt-1 text-xs">
            <span className="text-gray-400">
              {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
            </span>
            <span className="text-purple-400">
              {(requiredXP - currentXP).toLocaleString()} to next level
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Compact XP Bar for Sidebar
// ============================================
interface XPBarCompactEliteProps {
  level: number;
  progress: number; // 0-100
  className?: string;
}

export function XPBarCompactElite({
  level,
  progress,
  className,
}: XPBarCompactEliteProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {/* Mini level badge */}
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="rgba(168, 85, 247, 0.2)"
            strokeWidth="3"
          />
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="url(#xp-gradient-compact)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 13}
            strokeDashoffset={2 * Math.PI * 13 * (1 - progress / 100)}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="xp-gradient-compact" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#50E3C2" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{level}</span>
        </div>
      </div>
      <span className="text-[9px] text-purple-400 font-medium">LVL</span>
    </div>
  );
}

// ============================================
// Level Up Celebration Component
// ============================================
interface LevelUpCelebrationProps {
  newLevel: number;
  onComplete?: () => void;
}

export function LevelUpCelebration({ newLevel, onComplete }: LevelUpCelebrationProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onComplete}
    >
      <div className="text-center animate-[scale-in_0.5s_ease-out]">
        {/* Cat celebration */}
        <div className="text-8xl mb-4 animate-bounce">🎉</div>

        <h2 className="text-4xl font-black gradient-text mb-2">LEVEL UP!</h2>

        <div className="relative inline-block">
          <span className="text-7xl font-black text-white">{newLevel}</span>
          <div className="absolute inset-0 blur-xl bg-purple-500/50" />
        </div>

        <p className="text-gray-400 mt-4">Click anywhere to continue</p>

        {/* Particle effects would go here */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#50E3C2]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
