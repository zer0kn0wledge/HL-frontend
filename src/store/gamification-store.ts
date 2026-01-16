// ============================================
// Gamification Store
// XP, Levels, Achievements, Streaks, Challenges
// ============================================

import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

// ============================================
// Types
// ============================================

export type XPSource =
  | "trade"
  | "profitable_trade"
  | "daily_login"
  | "daily_challenge"
  | "achievement"
  | "referral"
  | "win_streak"
  | "guild_activity"
  | "event_bonus"
  | "battle_win"
  | "battlepass";

export interface XPEvent {
  id: string;
  amount: number;
  source: XPSource;
  details?: string;
  multiplier: number;
  createdAt: Date;
}

export interface UserXP {
  level: number;
  currentXp: number;
  totalXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  prestige: number;
  prestigeAt?: Date;
  xpMultiplier: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  current: number;
  xpReward: number;
  expiresAt: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  current: number;
  xpReward: number;
  weekNumber: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface Streak {
  currentStreak: number;
  lastActivityDate: string | null;
  longestStreak: number;
  totalActiveDays: number;
  streakMilestones: Record<number, boolean>;
}

export interface Achievement {
  id: string;
  earnedAt: Date;
}

// ============================================
// XP Calculation Functions
// ============================================

// XP formula: XP(n) = 100 * n * (n + 1) / 2
export function getXpForLevel(level: number): number {
  return Math.floor(100 * level * (level + 1) / 2);
}

export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (xpNeeded + getXpForLevel(level) <= totalXp) {
    xpNeeded += getXpForLevel(level);
    level++;
  }
  return level - 1 || 1;
}

export function getXpProgress(totalXp: number): {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  const level = getLevelFromTotalXp(totalXp);
  const xpForCurrentLevel = getTotalXpForLevel(level);
  const currentXp = totalXp - xpForCurrentLevel;
  const xpToNextLevel = getXpForLevel(level + 1);
  const progressPercent = (currentXp / xpToNextLevel) * 100;

  return {
    level,
    currentXp,
    xpToNextLevel,
    progressPercent,
  };
}

// ============================================
// XP Rewards Configuration
// ============================================

export const XP_REWARDS = {
  trade: 10,
  profitable_trade: 25,
  daily_login: 50,
  first_trade_of_day: 25,
  daily_challenge: 100, // base, varies by difficulty
  achievement: 200, // base, varies by achievement
  referral: 500,
  win_streak_bonus: 10, // per consecutive win
  guild_activity: 20,
  event_bonus: 50,
  battle_win: 100,
} as const;

// ============================================
// Streak Milestones
// ============================================

export const STREAK_MILESTONES = {
  7: { xp: 500, badge: "week_warrior", hype: 5 },
  14: { xp: 750, badge: "two_week_champ", hype: 15 },
  30: { xp: 2000, badge: "monthly_master", hype: 50 },
  60: { xp: 4000, badge: "two_month_titan", hype: 100 },
  100: { xp: 10000, badge: "century_streak", hype: 250 },
  365: { xp: 50000, badge: "annual_legend", hype: 1000 },
} as const;

// ============================================
// Store Interface
// ============================================

interface GamificationState {
  // XP State
  xp: UserXP;
  xpHistory: XPEvent[];

  // Achievements
  unlockedAchievements: Achievement[];

  // Streaks
  streak: Streak;

  // Daily Challenges
  dailyChallenges: DailyChallenge[];
  lastChallengeRefresh: string | null;

  // Weekly Missions
  weeklyMissions: WeeklyMission[];

  // Battle Pass
  battlePassLevel: number;
  battlePassXp: number;
  isPremium: boolean;
  claimedFreeRewards: number[];
  claimedPremiumRewards: number[];

  // UI State
  showLevelUpModal: boolean;
  pendingLevelUp: number | null;
  recentXpGains: XPEvent[];

  // Actions
  addXp: (amount: number, source: XPSource, details?: string) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  completeChallenge: (challengeId: string) => void;
  completeMission: (missionId: string) => void;
  setDailyChallenges: (challenges: DailyChallenge[]) => void;
  setWeeklyMissions: (missions: WeeklyMission[]) => void;
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  claimBattlePassReward: (level: number, isPremiumReward: boolean) => void;
  upgradeToPremium: () => void;
  prestige: () => void;
  dismissLevelUp: () => void;
  clearRecentXpGains: () => void;
}

// ============================================
// Initial State
// ============================================

const initialXP: UserXP = {
  level: 1,
  currentXp: 0,
  totalXp: 0,
  xpToNextLevel: getXpForLevel(2),
  progressPercent: 0,
  prestige: 0,
  xpMultiplier: 1.0,
};

const initialStreak: Streak = {
  currentStreak: 0,
  lastActivityDate: null,
  longestStreak: 0,
  totalActiveDays: 0,
  streakMilestones: {},
};

// ============================================
// Store Implementation
// ============================================

export const useGamificationStore = create<GamificationState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial State
      xp: initialXP,
      xpHistory: [],
      unlockedAchievements: [],
      streak: initialStreak,
      dailyChallenges: [],
      lastChallengeRefresh: null,
      weeklyMissions: [],
      battlePassLevel: 0,
      battlePassXp: 0,
      isPremium: false,
      claimedFreeRewards: [],
      claimedPremiumRewards: [],
      showLevelUpModal: false,
      pendingLevelUp: null,
      recentXpGains: [],

      // Add XP
      addXp: (amount, source, details) => {
        const state = get();
        const multiplier = state.xp.xpMultiplier;
        const finalAmount = Math.floor(amount * multiplier);

        const event: XPEvent = {
          id: `xp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          amount: finalAmount,
          source,
          details,
          multiplier,
          createdAt: new Date(),
        };

        const newTotalXp = state.xp.totalXp + finalAmount;
        const progress = getXpProgress(newTotalXp);

        const oldLevel = state.xp.level;
        const leveledUp = progress.level > oldLevel;

        set({
          xp: {
            ...state.xp,
            level: progress.level,
            currentXp: progress.currentXp,
            totalXp: newTotalXp,
            xpToNextLevel: progress.xpToNextLevel,
            progressPercent: progress.progressPercent,
          },
          xpHistory: [event, ...state.xpHistory].slice(0, 100),
          recentXpGains: [event, ...state.recentXpGains].slice(0, 5),
          showLevelUpModal: leveledUp,
          pendingLevelUp: leveledUp ? progress.level : null,
          // Also add to battle pass XP
          battlePassXp: state.battlePassXp + finalAmount,
          battlePassLevel: Math.floor((state.battlePassXp + finalAmount) / 1000), // 1000 XP per BP level
        });
      },

      // Unlock Achievement
      unlockAchievement: (achievementId) => {
        const state = get();
        if (state.unlockedAchievements.find((a) => a.id === achievementId)) {
          return; // Already unlocked
        }

        set({
          unlockedAchievements: [
            ...state.unlockedAchievements,
            { id: achievementId, earnedAt: new Date() },
          ],
        });
      },

      // Update Streak
      updateStreak: () => {
        const state = get();
        const today = new Date().toISOString().split("T")[0];
        const lastDate = state.streak.lastActivityDate;

        if (lastDate === today) {
          return; // Already logged today
        }

        let newStreak = 1;
        if (lastDate) {
          const lastDateObj = new Date(lastDate);
          const todayObj = new Date(today);
          const diffDays = Math.floor(
            (todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            newStreak = state.streak.currentStreak + 1;
          }
          // If more than 1 day, streak resets to 1
        }

        const newMilestones = { ...state.streak.streakMilestones };
        Object.keys(STREAK_MILESTONES).forEach((milestone) => {
          const m = parseInt(milestone);
          if (newStreak >= m && !newMilestones[m]) {
            newMilestones[m] = true;
            // Award milestone rewards
            const reward = STREAK_MILESTONES[m as keyof typeof STREAK_MILESTONES];
            get().addXp(reward.xp, "daily_login", `${m}-day streak milestone`);
          }
        });

        set({
          streak: {
            currentStreak: newStreak,
            lastActivityDate: today,
            longestStreak: Math.max(state.streak.longestStreak, newStreak),
            totalActiveDays: state.streak.totalActiveDays + 1,
            streakMilestones: newMilestones,
          },
        });
      },

      // Complete Challenge
      completeChallenge: (challengeId) => {
        const state = get();
        set({
          dailyChallenges: state.dailyChallenges.map((c) =>
            c.id === challengeId
              ? { ...c, isCompleted: true, completedAt: new Date() }
              : c
          ),
        });
      },

      // Complete Mission
      completeMission: (missionId) => {
        const state = get();
        set({
          weeklyMissions: state.weeklyMissions.map((m) =>
            m.id === missionId
              ? { ...m, isCompleted: true, completedAt: new Date() }
              : m
          ),
        });
      },

      // Set Daily Challenges
      setDailyChallenges: (challenges) => {
        set({
          dailyChallenges: challenges,
          lastChallengeRefresh: new Date().toISOString().split("T")[0],
        });
      },

      // Set Weekly Missions
      setWeeklyMissions: (missions) => {
        set({ weeklyMissions: missions });
      },

      // Update Challenge Progress
      updateChallengeProgress: (challengeId, progress) => {
        const state = get();
        set({
          dailyChallenges: state.dailyChallenges.map((c) =>
            c.id === challengeId
              ? {
                  ...c,
                  current: Math.min(progress, c.target),
                  isCompleted: progress >= c.target,
                  completedAt: progress >= c.target && !c.isCompleted ? new Date() : c.completedAt,
                }
              : c
          ),
        });
      },

      // Update Mission Progress
      updateMissionProgress: (missionId, progress) => {
        const state = get();
        set({
          weeklyMissions: state.weeklyMissions.map((m) =>
            m.id === missionId
              ? {
                  ...m,
                  current: Math.min(progress, m.target),
                  isCompleted: progress >= m.target,
                  completedAt: progress >= m.target && !m.isCompleted ? new Date() : m.completedAt,
                }
              : m
          ),
        });
      },

      // Claim Battle Pass Reward
      claimBattlePassReward: (level, isPremiumReward) => {
        const state = get();
        if (isPremiumReward) {
          if (!state.isPremium || state.claimedPremiumRewards.includes(level)) return;
          set({ claimedPremiumRewards: [...state.claimedPremiumRewards, level] });
        } else {
          if (state.claimedFreeRewards.includes(level)) return;
          set({ claimedFreeRewards: [...state.claimedFreeRewards, level] });
        }
      },

      // Upgrade to Premium
      upgradeToPremium: () => {
        set({ isPremium: true });
      },

      // Prestige (reset at level 100)
      prestige: () => {
        const state = get();
        if (state.xp.level < 100) return;

        const newPrestige = state.xp.prestige + 1;
        const newMultiplier = 1.0 + newPrestige * 0.1; // +10% per prestige

        set({
          xp: {
            ...initialXP,
            prestige: newPrestige,
            prestigeAt: new Date(),
            xpMultiplier: newMultiplier,
          },
          battlePassLevel: 0,
          battlePassXp: 0,
        });
      },

      // Dismiss Level Up Modal
      dismissLevelUp: () => {
        set({ showLevelUpModal: false, pendingLevelUp: null });
      },

      // Clear Recent XP Gains
      clearRecentXpGains: () => {
        set({ recentXpGains: [] });
      },
    })),
    {
      name: "hyperterminal-gamification",
      partialize: (state) => ({
        xp: state.xp,
        unlockedAchievements: state.unlockedAchievements,
        streak: state.streak,
        battlePassLevel: state.battlePassLevel,
        battlePassXp: state.battlePassXp,
        isPremium: state.isPremium,
        claimedFreeRewards: state.claimedFreeRewards,
        claimedPremiumRewards: state.claimedPremiumRewards,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectLevel = (state: GamificationState) => state.xp.level;
export const selectTotalXp = (state: GamificationState) => state.xp.totalXp;
export const selectXpProgress = (state: GamificationState) => state.xp.progressPercent;
export const selectPrestige = (state: GamificationState) => state.xp.prestige;
export const selectStreak = (state: GamificationState) => state.streak.currentStreak;
export const selectBattlePassLevel = (state: GamificationState) => state.battlePassLevel;
export const selectIsPremium = (state: GamificationState) => state.isPremium;
