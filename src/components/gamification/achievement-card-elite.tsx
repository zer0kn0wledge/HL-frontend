"use client";

import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";

// ============================================
// Types
// ============================================
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

interface AchievementCardEliteProps {
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
  xpReward: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: Date;
  className?: string;
}

// ============================================
// Rarity Configuration
// ============================================
const rarityConfig: Record<
  Rarity,
  {
    bg: string;
    border: string;
    glow: string;
    text: string;
    badge: string;
  }
> = {
  common: {
    bg: "from-gray-800/30 to-gray-900/30",
    border: "border-gray-600/30",
    glow: "",
    text: "text-gray-400",
    badge: "bg-gray-600",
  },
  uncommon: {
    bg: "from-green-900/30 to-green-950/30",
    border: "border-green-500/30",
    glow: "shadow-[0_0_15px_rgba(34,197,94,0.2)]",
    text: "text-green-400",
    badge: "bg-green-500",
  },
  rare: {
    bg: "from-blue-900/30 to-blue-950/30",
    border: "border-blue-500/30",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    text: "text-blue-400",
    badge: "bg-blue-500",
  },
  epic: {
    bg: "from-purple-900/30 to-purple-950/30",
    border: "border-purple-500/30",
    glow: "shadow-[0_0_25px_rgba(168,85,247,0.4)]",
    text: "text-purple-400",
    badge: "bg-purple-500",
  },
  legendary: {
    bg: "from-amber-900/30 to-orange-950/30",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.5)]",
    text: "text-amber-400",
    badge: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
  mythic: {
    bg: "from-pink-900/30 via-purple-900/30 to-cyan-900/30",
    border: "border-pink-500/30",
    glow: "shadow-[0_0_40px_rgba(236,72,153,0.5)]",
    text: "text-pink-400",
    badge: "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500",
  },
};

// ============================================
// Achievement Card Elite Component
// ============================================
export function AchievementCardElite({
  name,
  description,
  icon,
  rarity,
  xpReward,
  unlocked,
  progress,
  maxProgress,
  className,
}: AchievementCardEliteProps) {
  const config = rarityConfig[rarity];
  const hasProgress = progress !== undefined && maxProgress !== undefined;
  const progressPercent = hasProgress ? (progress / maxProgress) * 100 : 0;

  return (
    <div
      className={cn(
        "relative rounded-xl p-4 border backdrop-blur-sm transition-all duration-300",
        `bg-gradient-to-br ${config.bg}`,
        config.border,
        unlocked && config.glow,
        !unlocked && "opacity-70 grayscale-[30%]",
        "hover:scale-[1.02] hover:-translate-y-1 cursor-pointer",
        className
      )}
    >
      {/* Rarity badge */}
      <div
        className={cn(
          "absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide",
          config.badge
        )}
      >
        {rarity}
      </div>

      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
            "bg-black/40 border border-white/10",
            unlocked && "animate-pulse-slow"
          )}
        >
          {unlocked ? icon : <Lock className="w-6 h-6 text-gray-500" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white truncate">{name}</h4>
          <p className="text-sm text-gray-400 line-clamp-2">{description}</p>

          {/* Progress bar (if not unlocked and has progress) */}
          {!unlocked && hasProgress && (
            <div className="mt-2">
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", config.badge)}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {progress} / {maxProgress}
              </div>
            </div>
          )}

          {/* XP Reward */}
          <div className={cn("text-sm font-semibold mt-2", config.text)}>
            +{xpReward.toLocaleString()} XP
          </div>
        </div>

        {/* Unlocked checkmark */}
        {unlocked && (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Shimmer effect on unlocked */}
      {unlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// Achievement Grid Component
// ============================================
interface AchievementGridProps {
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: Rarity;
    xpReward: number;
    unlocked: boolean;
    progress?: number;
    maxProgress?: number;
  }>;
  className?: string;
}

export function AchievementGrid({ achievements, className }: AchievementGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {achievements.map((achievement) => (
        <AchievementCardElite
          key={achievement.id}
          name={achievement.name}
          description={achievement.description}
          icon={achievement.icon}
          rarity={achievement.rarity}
          xpReward={achievement.xpReward}
          unlocked={achievement.unlocked}
          progress={achievement.progress}
          maxProgress={achievement.maxProgress}
        />
      ))}
    </div>
  );
}

// ============================================
// Achievement Unlock Toast Component
// ============================================
interface AchievementUnlockToastProps {
  achievement: {
    name: string;
    icon: string;
    rarity: Rarity;
    xpReward: number;
  };
}

export function AchievementUnlockToast({ achievement }: AchievementUnlockToastProps) {
  const config = rarityConfig[achievement.rarity];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md",
        `bg-gradient-to-r ${config.bg}`,
        config.border,
        config.glow
      )}
    >
      <div className="text-2xl">{achievement.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Achievement Unlocked!</p>
        <p className="font-bold text-white truncate">{achievement.name}</p>
      </div>
      <div className={cn("text-sm font-bold", config.text)}>+{achievement.xpReward} XP</div>
    </div>
  );
}

// ============================================
// Sample Achievements Data
// ============================================
export const SAMPLE_ACHIEVEMENTS = [
  {
    id: "first-trade",
    name: "First Blood",
    description: "Execute your first trade on the platform",
    icon: "🎯",
    rarity: "common" as Rarity,
    xpReward: 100,
    unlocked: true,
  },
  {
    id: "whale-alert",
    name: "Whale Alert",
    description: "Execute a single trade worth over $100,000",
    icon: "🐋",
    rarity: "legendary" as Rarity,
    xpReward: 5000,
    unlocked: false,
    progress: 45000,
    maxProgress: 100000,
  },
  {
    id: "win-streak-5",
    name: "Hot Streak",
    description: "Win 5 trades in a row",
    icon: "🔥",
    rarity: "rare" as Rarity,
    xpReward: 500,
    unlocked: true,
  },
  {
    id: "diamond-hands",
    name: "Diamond Hands",
    description: "Hold a winning position for over 7 days",
    icon: "💎",
    rarity: "epic" as Rarity,
    xpReward: 1000,
    unlocked: false,
    progress: 3,
    maxProgress: 7,
  },
  {
    id: "degen-god",
    name: "Degen God",
    description: "Achieve 1000% ROI on a single trade",
    icon: "👑",
    rarity: "mythic" as Rarity,
    xpReward: 10000,
    unlocked: false,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Trade within the first hour of market open",
    icon: "🐦",
    rarity: "uncommon" as Rarity,
    xpReward: 250,
    unlocked: true,
  },
];
