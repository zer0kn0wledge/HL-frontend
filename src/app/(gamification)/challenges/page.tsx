"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGamificationStore,
  type DailyChallenge,
  type WeeklyMission,
} from "@/store/gamification-store";
import { StreakCounter } from "@/components/gamification/level-up-modal";
import {
  Target,
  Clock,
  Zap,
  Gift,
  Check,
  Flame,
  Trophy,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Mock Daily Challenges
// ============================================

const MOCK_DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: "dc-1",
    title: "First Blood",
    description: "Complete your first profitable trade of the day",
    type: "profitable_trade",
    target: 1,
    current: 0,
    xpReward: 100,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    isCompleted: false,
  },
  {
    id: "dc-2",
    title: "Limit Order Pro",
    description: "Close a position using a limit order",
    type: "limit_close",
    target: 1,
    current: 1,
    xpReward: 100,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    isCompleted: true,
    completedAt: new Date(Date.now() - 3600000),
  },
  {
    id: "dc-3",
    title: "Diversifier",
    description: "Trade 2 different markets today",
    type: "markets_traded",
    target: 2,
    current: 1,
    xpReward: 125,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    isCompleted: false,
  },
  {
    id: "dc-4",
    title: "Risk Manager",
    description: "Use max 5x leverage on a trade",
    type: "low_leverage_trade",
    target: 1,
    current: 0,
    xpReward: 200,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    isCompleted: false,
  },
];

const MOCK_WEEKLY_MISSIONS: WeeklyMission[] = [
  {
    id: "wm-1",
    title: "Active Trader",
    description: "Execute 10 trades this week",
    type: "trades_count",
    target: 10,
    current: 7,
    xpReward: 500,
    weekNumber: 3,
    isCompleted: false,
  },
  {
    id: "wm-2",
    title: "Profit Seeker",
    description: "Make $500 in realized profit",
    type: "profit_amount",
    target: 500,
    current: 320,
    xpReward: 750,
    weekNumber: 3,
    isCompleted: false,
  },
  {
    id: "wm-3",
    title: "Market Explorer",
    description: "Trade 5 different markets",
    type: "markets_traded",
    target: 5,
    current: 3,
    xpReward: 400,
    weekNumber: 3,
    isCompleted: false,
  },
  {
    id: "wm-4",
    title: "Hot Streak",
    description: "Win 5 trades in a row",
    type: "win_streak",
    target: 5,
    current: 2,
    xpReward: 600,
    weekNumber: 3,
    isCompleted: false,
  },
];

// ============================================
// Components
// ============================================

function TimeRemaining({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className={cn("text-xs", timeLeft === "Expired" ? "text-red-400" : "text-muted-foreground")}>
      <Clock className="h-3 w-3 inline mr-1" />
      {timeLeft}
    </span>
  );
}

function DailyChallengeCard({ challenge }: { challenge: DailyChallenge }) {
  const progressPercent = (challenge.current / challenge.target) * 100;
  const { addXp, completeChallenge } = useGamificationStore();

  const handleClaim = () => {
    if (challenge.isCompleted) return;
    addXp(challenge.xpReward, "daily_challenge", challenge.title);
    completeChallenge(challenge.id);
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        challenge.isCompleted
          ? "bg-emerald-500/5 border-emerald-500/30"
          : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {challenge.isCompleted ? (
              <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : (
              <Target className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-medium">{challenge.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono">
                {challenge.current}/{challenge.target}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className={cn("h-2", challenge.isCompleted && "[&>div]:bg-emerald-500")}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <TimeRemaining expiresAt={challenge.expiresAt} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary font-medium">+{challenge.xpReward} XP</span>
              {challenge.current >= challenge.target && !challenge.isCompleted && (
                <Button size="sm" onClick={handleClaim}>
                  Claim
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyMissionCard({ mission }: { mission: WeeklyMission }) {
  const progressPercent = (mission.current / mission.target) * 100;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        mission.isCompleted
          ? "bg-primary/5 border-primary/30"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {mission.isCompleted ? (
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : (
              <Trophy className="h-5 w-5 text-amber-400" />
            )}
            <h3 className="font-medium">{mission.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono">
                {typeof mission.current === "number" ? mission.current : mission.current}/{mission.target}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className={cn("h-2", mission.isCompleted && "[&>div]:bg-primary")}
            />
          </div>

          {/* XP Reward */}
          <div className="flex justify-end">
            <span className="text-xs text-primary font-medium">+{mission.xpReward} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StreakCard() {
  const { streak } = useGamificationStore();

  const streakRewards = [
    { day: 1, xp: 50 },
    { day: 2, xp: 60 },
    { day: 3, xp: 75 },
    { day: 4, xp: 90 },
    { day: 5, xp: 110 },
    { day: 6, xp: 130 },
    { day: 7, xp: 500, special: true },
  ];

  const currentDay = Math.min(streak.currentStreak % 7 || 7, 7);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          <h3 className="font-semibold">Daily Streak</h3>
        </div>
        <StreakCounter />
      </div>

      {/* Streak Progress */}
      <div className="flex justify-between mb-2">
        {streakRewards.map((reward, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col items-center",
              i + 1 <= currentDay ? "opacity-100" : "opacity-40"
            )}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold mb-1",
                i + 1 < currentDay
                  ? "bg-emerald-500 text-white"
                  : i + 1 === currentDay
                  ? "bg-orange-500 text-white"
                  : "bg-muted"
              )}
            >
              {i + 1 < currentDay ? (
                <Check className="h-4 w-4" />
              ) : reward.special ? (
                <Gift className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span className={cn("text-[10px]", reward.special && "text-amber-400")}>
              +{reward.xp}
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-lg font-bold">{streak.currentStreak}</div>
          <div className="text-xs text-muted-foreground">Current</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{streak.longestStreak}</div>
          <div className="text-xs text-muted-foreground">Best</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{streak.totalActiveDays}</div>
          <div className="text-xs text-muted-foreground">Total Days</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function ChallengesPage() {
  const { setDailyChallenges, setWeeklyMissions, dailyChallenges, weeklyMissions } =
    useGamificationStore();

  // Initialize mock data
  useEffect(() => {
    if (dailyChallenges.length === 0) {
      setDailyChallenges(MOCK_DAILY_CHALLENGES);
    }
    if (weeklyMissions.length === 0) {
      setWeeklyMissions(MOCK_WEEKLY_MISSIONS);
    }
  }, []);

  const activeChallenges = dailyChallenges.length > 0 ? dailyChallenges : MOCK_DAILY_CHALLENGES;
  const activeMissions = weeklyMissions.length > 0 ? weeklyMissions : MOCK_WEEKLY_MISSIONS;

  const completedDaily = activeChallenges.filter((c) => c.isCompleted).length;
  const completedWeekly = activeMissions.filter((m) => m.isCompleted).length;

  return (
    <div className="flex h-screen">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold mb-2">Challenges</h1>
            <p className="text-muted-foreground">
              Complete challenges to earn XP and climb the leaderboard
            </p>
          </div>

          {/* Daily Challenges */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Daily Challenges</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {completedDaily}/{activeChallenges.length} completed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallenges.map((challenge) => (
                <DailyChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </section>

          {/* Weekly Missions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold">Weekly Missions</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {completedWeekly}/{activeMissions.length} completed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeMissions.map((mission) => (
                <WeeklyMissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-80 border-l border-border p-4">
        <StreakCard />
      </div>
    </div>
  );
}
