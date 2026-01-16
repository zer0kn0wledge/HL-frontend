"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Target,
  Zap,
  Users,
  Flame,
  Star,
  Lock,
  Check,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGES, getBadgesByCategory, BADGE_XP_REWARDS, type BadgeRarity, type BadgeCategory } from "@/lib/achievements/badges";

// ============================================
// Types
// ============================================

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress?: {
    current: number;
    target: number;
  };
  isHidden: boolean;
}

// ============================================
// Mock Data - Convert badges to achievements
// ============================================

const MOCK_ACHIEVEMENTS: Achievement[] = Object.values(BADGES).map((badge, index) => ({
  id: badge.id,
  name: badge.name,
  description: badge.description,
  icon: badge.icon,
  category: badge.category,
  rarity: badge.rarity,
  xpReward: BADGE_XP_REWARDS[badge.rarity],
  isUnlocked: index < 8, // First 8 are unlocked
  unlockedAt: index < 8 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
  progress: index < 12 && index >= 8 ? { current: Math.floor(Math.random() * 80), target: 100 } : undefined,
  isHidden: badge.hidden || false,
}));

// ============================================
// Components
// ============================================

const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: "border-zinc-500 bg-zinc-500/10",
  uncommon: "border-green-500 bg-green-500/10",
  rare: "border-blue-500 bg-blue-500/10",
  epic: "border-purple-500 bg-purple-500/10",
  legendary: "border-amber-500 bg-amber-500/10",
  mythic: "border-red-500 bg-red-500/10",
};

const RARITY_GLOW: Record<BadgeRarity, string> = {
  common: "",
  uncommon: "",
  rare: "shadow-blue-500/20",
  epic: "shadow-purple-500/30",
  legendary: "shadow-amber-500/40",
  mythic: "shadow-red-500/50",
};

const CATEGORY_ICONS: Record<BadgeCategory, React.ReactNode> = {
  trading: <TrendingUp className="h-4 w-4" />,
  streak: <Flame className="h-4 w-4" />,
  volume: <Zap className="h-4 w-4" />,
  social: <Users className="h-4 w-4" />,
  special: <Star className="h-4 w-4" />,
  seasonal: <Trophy className="h-4 w-4" />,
};

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isInProgress = achievement.progress && !achievement.isUnlocked;
  const progressPercent = achievement.progress
    ? (achievement.progress.current / achievement.progress.target) * 100
    : 0;

  if (achievement.isHidden && !achievement.isUnlocked) {
    return (
      <div className="p-4 rounded-lg border border-border bg-card/50 opacity-60">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">Hidden Achievement</h3>
            <p className="text-sm text-muted-foreground">???</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        achievement.isUnlocked
          ? cn(RARITY_COLORS[achievement.rarity], "shadow-lg", RARITY_GLOW[achievement.rarity])
          : "border-border bg-card/50 opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center text-2xl",
            achievement.isUnlocked ? "bg-background/50" : "bg-muted"
          )}
        >
          {achievement.isUnlocked ? achievement.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{achievement.name}</h3>
            {achievement.isUnlocked && (
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{achievement.description}</p>

          {/* Progress Bar */}
          {isInProgress && achievement.progress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono">
                  {achievement.progress.current}/{achievement.progress.target}
                </span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}

          {/* XP Reward */}
          <div className="flex items-center justify-between mt-2">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded capitalize",
                RARITY_COLORS[achievement.rarity]
              )}
            >
              {achievement.rarity}
            </span>
            <span className="text-xs text-primary font-medium">+{achievement.xpReward} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard() {
  const totalAchievements = MOCK_ACHIEVEMENTS.filter((a) => !a.isHidden).length;
  const unlockedAchievements = MOCK_ACHIEVEMENTS.filter((a) => a.isUnlocked).length;
  const totalXp = MOCK_ACHIEVEMENTS.filter((a) => a.isUnlocked).reduce((sum, a) => sum + a.xpReward, 0);
  const completionPercent = (unlockedAchievements / totalAchievements) * 100;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold mb-4">Achievement Progress</h2>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Completion</span>
          <span className="font-mono">
            {unlockedAchievements}/{totalAchievements}
          </span>
        </div>
        <Progress value={completionPercent} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold">{unlockedAchievements}</div>
          <div className="text-xs text-muted-foreground">Unlocked</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold text-primary">+{totalXp.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">XP Earned</div>
        </div>
      </div>

      {/* Rarity Breakdown */}
      <div className="mt-4 pt-4 border-t border-border">
        <h3 className="text-sm font-medium mb-3">By Rarity</h3>
        <div className="space-y-2">
          {(["common", "uncommon", "rare", "epic", "legendary", "mythic"] as BadgeRarity[]).map((rarity) => {
            const total = MOCK_ACHIEVEMENTS.filter((a) => a.rarity === rarity && !a.isHidden).length;
            const unlocked = MOCK_ACHIEVEMENTS.filter((a) => a.rarity === rarity && a.isUnlocked).length;
            if (total === 0) return null;
            return (
              <div key={rarity} className="flex items-center justify-between text-sm">
                <span className={cn("capitalize", RARITY_COLORS[rarity].replace("border-", "text-").split(" ")[0])}>
                  {rarity}
                </span>
                <span className="font-mono text-muted-foreground">
                  {unlocked}/{total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | "all">("all");

  const filteredAchievements =
    selectedCategory === "all"
      ? MOCK_ACHIEVEMENTS
      : MOCK_ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const categories: (BadgeCategory | "all")[] = ["all", "trading", "volume", "streak", "social", "special", "seasonal"];

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">Achievements</h1>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {category !== "all" && CATEGORY_ICONS[category]}
                <span className="capitalize">{category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Achievement Grid */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Sidebar - Stats */}
      <div className="hidden lg:block w-80 border-l border-border p-4">
        <StatsCard />
      </div>
    </div>
  );
}
