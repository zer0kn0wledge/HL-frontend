"use client";

import { useGamificationStore } from "@/store/gamification-store";
import { cn } from "@/lib/utils";
import { Star, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// Compact XP Bar (for header)
// ============================================

export function XPBarCompact() {
  const { xp, recentXpGains } = useGamificationStore();
  const hasRecentGains = recentXpGains.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            {/* Level Badge */}
            <div className="relative">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold",
                  xp.prestige > 0
                    ? "bg-gradient-to-br from-amber-500 to-orange-600"
                    : "bg-gradient-to-br from-primary to-primary/60"
                )}
              >
                {xp.level}
              </div>
              {xp.prestige > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                  <Star className="h-2.5 w-2.5 text-white fill-white" />
                </div>
              )}
            </div>

            {/* XP Progress Bar */}
            <div className="w-24 hidden sm:block">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    hasRecentGains
                      ? "bg-gradient-to-r from-primary via-primary to-emerald-400 animate-pulse"
                      : "bg-primary"
                  )}
                  style={{ width: `${xp.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>{xp.currentXp.toLocaleString()}</span>
                <span>{xp.xpToNextLevel.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-64">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Level {xp.level}</span>
              {xp.prestige > 0 && (
                <span className="text-xs text-amber-400">Prestige {xp.prestige}</span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span>
                  {xp.currentXp.toLocaleString()} / {xp.xpToNextLevel.toLocaleString()} XP
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${xp.progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total XP</span>
              <span>{xp.totalXp.toLocaleString()}</span>
            </div>
            {xp.xpMultiplier > 1 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">XP Multiplier</span>
                <span className="text-emerald-400">{xp.xpMultiplier}x</span>
              </div>
            )}

            {/* Recent XP Gains */}
            {recentXpGains.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Recent</p>
                {recentXpGains.slice(0, 3).map((gain) => (
                  <div key={gain.id} className="flex justify-between text-xs">
                    <span className="capitalize">{gain.source.replace(/_/g, " ")}</span>
                    <span className="text-emerald-400">+{gain.amount} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// Full XP Bar (for profile/gamification pages)
// ============================================

export function XPBarFull() {
  const { xp } = useGamificationStore();

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-4">
        {/* Level Badge */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold",
              xp.prestige > 0
                ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30"
                : "bg-gradient-to-br from-primary to-primary/60"
            )}
          >
            {xp.level}
          </div>
          {xp.prestige > 0 && (
            <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
              <Star className="h-3.5 w-3.5 text-white fill-white" />
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">Level {xp.level}</span>
            <span className="text-sm text-muted-foreground">
              {xp.totalXp.toLocaleString()} Total XP
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${xp.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{xp.currentXp.toLocaleString()} XP</span>
            <span>{xp.xpToNextLevel.toLocaleString()} XP to level {xp.level + 1}</span>
          </div>

          {/* Multiplier & Prestige */}
          <div className="flex gap-3 mt-2">
            {xp.prestige > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                Prestige {xp.prestige}
              </div>
            )}
            {xp.xpMultiplier > 1 && (
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <Zap className="h-3 w-3" />
                {xp.xpMultiplier}x XP
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Level Badge (standalone)
// ============================================

interface LevelBadgeProps {
  level: number;
  prestige?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function LevelBadge({ level, prestige = 0, size = "md", showLabel = false }: LevelBadgeProps) {
  const sizes = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg",
  };

  const starSizes = {
    sm: "h-3 w-3 -top-0.5 -right-0.5",
    md: "h-4 w-4 -top-1 -right-1",
    lg: "h-5 w-5 -top-1 -right-1",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            "rounded-lg flex items-center justify-center font-bold",
            sizes[size],
            prestige > 0
              ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : "bg-gradient-to-br from-primary to-primary/60"
          )}
        >
          {level}
        </div>
        {prestige > 0 && (
          <div
            className={cn(
              "absolute rounded-full bg-amber-500 flex items-center justify-center",
              starSizes[size]
            )}
          >
            <Star className="h-2 w-2 text-white fill-white" />
          </div>
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">Level {level}</span>
      )}
    </div>
  );
}
