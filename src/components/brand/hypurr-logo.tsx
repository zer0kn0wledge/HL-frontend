"use client";

import { cn } from "@/lib/utils";

// ============================================
// Hypurr Cat States for different contexts
// ============================================
export const HYPURR_STATES = {
  default: "😺",      // Normal state
  happy: "😸",        // Win, profit
  excited: "🙀",      // Big win, achievement
  cool: "😎",         // VIP, pro trader
  thinking: "🤔",     // Loading, processing
  sleeping: "😴",     // Idle, no activity
  celebrating: "🎉",  // Level up, milestone
  money: "🤑",        // Huge profit
  nervous: "😰",      // Liquidation warning
  crying: "😿",       // Loss
} as const;

export type HypurrState = keyof typeof HYPURR_STATES;

// ============================================
// HypurrLogo Component Props
// ============================================
interface HypurrLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  state?: HypurrState;
  className?: string;
}

const sizes = {
  sm: { emoji: "text-xl", text: "text-sm", gap: "gap-1.5" },
  md: { emoji: "text-2xl", text: "text-lg", gap: "gap-2" },
  lg: { emoji: "text-4xl", text: "text-2xl", gap: "gap-3" },
  xl: { emoji: "text-5xl", text: "text-3xl", gap: "gap-4" },
};

// ============================================
// HypurrLogo Component
// ============================================
export function HypurrLogo({
  size = "md",
  showText = true,
  animated = true,
  state = "default",
  className,
}: HypurrLogoProps) {
  const { emoji, text, gap } = sizes[size];

  return (
    <div
      className={cn(
        "flex items-center select-none cursor-pointer group",
        gap,
        className
      )}
    >
      {/* Cat Emoji with Glow */}
      <span
        className={cn(
          emoji,
          animated && "animate-neon-pulse transition-transform group-hover:scale-110"
        )}
        style={{
          filter: "drop-shadow(0 0 8px rgba(80, 227, 194, 0.6))",
        }}
      >
        {HYPURR_STATES[state]}
      </span>

      {/* Logo Text */}
      {showText && (
        <span className={cn("font-bold tracking-tight", text)}>
          <span className="text-white">Hyper</span>
          <span className="text-[#50E3C2]">Terminal</span>
        </span>
      )}
    </div>
  );
}

// ============================================
// Compact Logo for Header
// ============================================
interface HypurrLogoCompactProps {
  className?: string;
}

export function HypurrLogoCompact({ className }: HypurrLogoCompactProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 select-none cursor-pointer group",
        className
      )}
    >
      {/* Glowing Cat Container */}
      <div
        className={cn(
          "relative w-9 h-9 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-[#50E3C2]/20 to-[#A855F7]/20",
          "border border-[#50E3C2]/30",
          "group-hover:border-[#50E3C2]/50",
          "transition-all duration-300",
          "animate-pulse-glow"
        )}
      >
        <span
          className="text-xl animate-neon-pulse"
          style={{
            filter: "drop-shadow(0 0 6px rgba(80, 227, 194, 0.8))",
          }}
        >
          😺
        </span>
      </div>

      {/* Text */}
      <div className="hidden sm:block">
        <div className="text-sm font-bold leading-tight">
          <span className="text-white">Zero's </span>
          <span className="text-[#50E3C2]">Hypurr</span>
        </div>
        <div className="text-[10px] text-[#9CA3AF] leading-tight">
          Terminal
        </div>
      </div>
    </div>
  );
}

// ============================================
// Animated Logo for Loading States
// ============================================
interface HypurrLoaderProps {
  text?: string;
  className?: string;
}

export function HypurrLoader({ text = "Loading...", className }: HypurrLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className={cn(
          "relative w-16 h-16 rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-[#50E3C2]/20 to-[#A855F7]/20",
          "border border-[#50E3C2]/30",
          "animate-pulse-glow"
        )}
      >
        <span
          className="text-3xl animate-neon-pulse"
          style={{
            filter: "drop-shadow(0 0 10px rgba(80, 227, 194, 0.8))",
          }}
        >
          😺
        </span>

        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-[#50E3C2] animate-spin" />
      </div>

      <p className="text-sm gradient-text font-medium">{text}</p>
    </div>
  );
}

// ============================================
// PnL Indicator with Cat State
// ============================================
interface PnLCatProps {
  pnl: number;
  size?: "sm" | "md" | "lg";
}

export function PnLCat({ pnl, size = "md" }: PnLCatProps) {
  const getState = (): HypurrState => {
    if (pnl > 10000) return "money";
    if (pnl > 1000) return "excited";
    if (pnl > 0) return "happy";
    if (pnl < -1000) return "crying";
    if (pnl < -500) return "nervous";
    return "default";
  };

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <span
      className={cn(
        sizeClasses[size],
        "transition-all duration-300"
      )}
      title={`PnL: ${pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}`}
    >
      {HYPURR_STATES[getState()]}
    </span>
  );
}
