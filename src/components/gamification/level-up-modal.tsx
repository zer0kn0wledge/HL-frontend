"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamificationStore, STREAK_MILESTONES } from "@/store/gamification-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Sparkles, Gift, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Level Unlock Data
// ============================================

const LEVEL_UNLOCKS: Record<number, { name: string; description: string; icon: string }> = {
  5: { name: "Custom Profile Frame", description: "Personalize your profile", icon: "🖼️" },
  10: { name: "Leaderboard Access", description: "View global rankings", icon: "🏆" },
  15: { name: "Create Feed Posts", description: "Share your trades", icon: "📝" },
  20: { name: "Name Color Options", description: "Stand out in chat", icon: "🎨" },
  25: { name: "Guild Creation", description: "Lead your own guild", icon: "⚔️" },
  30: { name: "Beta Features", description: "Early access to new features", icon: "🧪" },
  35: { name: "Custom Trade Sounds", description: "Personalized audio", icon: "🔔" },
  50: { name: "Veteran Badge", description: "Show your experience", icon: "🎖️" },
  60: { name: "Live Rooms", description: "Host trading sessions", icon: "📺" },
  70: { name: "Signal Provider", description: "Share trading signals", icon: "📡" },
  100: { name: "Master Trader Title", description: "Prestige available!", icon: "👑" },
};

// ============================================
// Level Up Modal Component
// ============================================

export function LevelUpModal() {
  const { showLevelUpModal, pendingLevelUp, dismissLevelUp, xp } = useGamificationStore();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (showLevelUpModal) {
      setShowConfetti(true);
      // Play level up sound
      const audio = new Audio("/sounds/level-up.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [showLevelUpModal]);

  if (!pendingLevelUp) return null;

  const unlock = LEVEL_UNLOCKS[pendingLevelUp];
  const canPrestige = pendingLevelUp >= 100;

  return (
    <Dialog open={showLevelUpModal} onOpenChange={() => dismissLevelUp()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Confetti Background */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 3 }}
              onAnimationComplete={() => setShowConfetti(false)}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  }}
                  initial={{ top: "-10%", rotate: 0 }}
                  animate={{
                    top: "110%",
                    rotate: Math.random() * 720 - 360,
                    x: Math.random() * 100 - 50,
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    ease: "easeOut",
                    delay: Math.random() * 0.5,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="mx-auto mb-4"
          >
            <div
              className={cn(
                "h-24 w-24 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-2xl",
                xp.prestige > 0
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/50"
                  : "bg-gradient-to-br from-primary to-primary/60 shadow-primary/50"
              )}
            >
              {pendingLevelUp}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DialogTitle className="text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400" />
              Level Up!
              <Sparkles className="h-6 w-6 text-amber-400" />
            </DialogTitle>
            <p className="text-muted-foreground mt-2">
              You've reached <span className="text-foreground font-semibold">Level {pendingLevelUp}</span>
            </p>
          </motion.div>
        </DialogHeader>

        {/* Unlock Display */}
        {unlock && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 my-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
                {unlock.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="font-semibold">New Unlock!</span>
                </div>
                <p className="text-sm font-medium">{unlock.name}</p>
                <p className="text-xs text-muted-foreground">{unlock.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Prestige Option */}
        {canPrestige && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-400">Prestige Available!</p>
                <p className="text-xs text-muted-foreground">
                  Reset to level 1 for permanent +10% XP bonus
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Next Level Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mb-4"
        >
          {LEVEL_UNLOCKS[pendingLevelUp + 5] ? (
            <>
              Next unlock at level {Object.keys(LEVEL_UNLOCKS).find(l => parseInt(l) > pendingLevelUp)}:
              <span className="text-foreground ml-1">
                {LEVEL_UNLOCKS[parseInt(Object.keys(LEVEL_UNLOCKS).find(l => parseInt(l) > pendingLevelUp) || "0")]?.name || "More rewards"}
              </span>
            </>
          ) : (
            "Keep trading to unlock more rewards!"
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button onClick={() => dismissLevelUp()} className="w-full">
            Continue
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// XP Gain Toast Component
// ============================================

interface XPGainToastProps {
  amount: number;
  source: string;
  onComplete?: () => void;
}

export function XPGainToast({ amount, source, onComplete }: XPGainToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border shadow-lg">
        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <div className="font-bold text-emerald-400">+{amount} XP</div>
          <div className="text-xs text-muted-foreground capitalize">
            {source.replace(/_/g, " ")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Streak Counter Component
// ============================================

export function StreakCounter() {
  const { streak } = useGamificationStore();

  if (streak.currentStreak === 0) return null;

  const nextMilestone = Object.keys(STREAK_MILESTONES)
    .map(Number)
    .find((m) => m > streak.currentStreak);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
      <span className="text-orange-400 text-lg">🔥</span>
      <span className="font-mono font-bold text-orange-400">{streak.currentStreak}</span>
      {nextMilestone && (
        <span className="text-xs text-muted-foreground">
          ({nextMilestone - streak.currentStreak} to milestone)
        </span>
      )}
    </div>
  );
}
