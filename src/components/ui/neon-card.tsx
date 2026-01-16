"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================
type GlowColor = "cyan" | "green" | "red" | "purple" | "gold" | "none";
type GlowIntensity = "subtle" | "medium" | "strong";

interface NeonCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: GlowColor;
  intensity?: GlowIntensity;
  hoverable?: boolean;
  animated?: boolean;
}

// ============================================
// Glow Styles
// ============================================
const glowStyles: Record<GlowColor, Record<GlowIntensity, string>> = {
  cyan: {
    subtle: "shadow-[0_0_15px_rgba(80,227,194,0.1)] border-[#50E3C2]/20",
    medium: "shadow-[0_0_25px_rgba(80,227,194,0.2)] border-[#50E3C2]/30",
    strong: "shadow-[0_0_40px_rgba(80,227,194,0.3)] border-[#50E3C2]/50",
  },
  green: {
    subtle: "shadow-[0_0_15px_rgba(34,197,94,0.1)] border-green-500/20",
    medium: "shadow-[0_0_25px_rgba(34,197,94,0.2)] border-green-500/30",
    strong: "shadow-[0_0_40px_rgba(34,197,94,0.3)] border-green-500/50",
  },
  red: {
    subtle: "shadow-[0_0_15px_rgba(239,68,68,0.1)] border-red-500/20",
    medium: "shadow-[0_0_25px_rgba(239,68,68,0.2)] border-red-500/30",
    strong: "shadow-[0_0_40px_rgba(239,68,68,0.3)] border-red-500/50",
  },
  purple: {
    subtle: "shadow-[0_0_15px_rgba(168,85,247,0.1)] border-purple-500/20",
    medium: "shadow-[0_0_25px_rgba(168,85,247,0.2)] border-purple-500/30",
    strong: "shadow-[0_0_40px_rgba(168,85,247,0.3)] border-purple-500/50",
  },
  gold: {
    subtle: "shadow-[0_0_15px_rgba(245,158,11,0.1)] border-amber-500/20",
    medium: "shadow-[0_0_25px_rgba(245,158,11,0.2)] border-amber-500/30",
    strong: "shadow-[0_0_40px_rgba(245,158,11,0.3)] border-amber-500/50",
  },
  none: {
    subtle: "border-white/5",
    medium: "border-white/10",
    strong: "border-white/20",
  },
};

// ============================================
// NeonCard Component
// ============================================
export const NeonCard = forwardRef<HTMLDivElement, NeonCardProps>(
  (
    {
      className,
      children,
      glow = "cyan",
      intensity = "subtle",
      hoverable = true,
      animated = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border bg-[#030712]/80 backdrop-blur-sm",
          glowStyles[glow][intensity],
          hoverable &&
            "transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(80,227,194,0.15)] hover:-translate-y-0.5",
          animated && "animate-pulse-glow",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeonCard.displayName = "NeonCard";

// ============================================
// NeonCardHeader Component
// ============================================
interface NeonCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  pulse?: boolean;
}

export function NeonCardHeader({
  title,
  icon,
  action,
  pulse = false,
  className,
  ...props
}: NeonCardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-white/5",
        className
      )}
      {...props}
    >
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        {pulse && (
          <span className="w-2 h-2 rounded-full bg-[#50E3C2] animate-pulse" />
        )}
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}

// ============================================
// NeonCardContent Component
// ============================================
interface NeonCardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function NeonCardContent({
  className,
  children,
  ...props
}: NeonCardContentProps) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}

// ============================================
// Rarity Card Component
// ============================================
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

interface RarityCardProps extends HTMLAttributes<HTMLDivElement> {
  rarity: Rarity;
  hoverable?: boolean;
}

const rarityStyles: Record<Rarity, string> = {
  common: "rarity-common border-gray-600/30",
  uncommon: "rarity-uncommon neon-glow-green",
  rare: "rarity-rare shadow-[0_0_20px_rgba(59,130,246,0.2)]",
  epic: "rarity-epic neon-glow-purple",
  legendary: "rarity-legendary neon-glow-gold",
  mythic: "rarity-mythic gradient-mythic",
};

export const RarityCard = forwardRef<HTMLDivElement, RarityCardProps>(
  ({ className, children, rarity, hoverable = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border backdrop-blur-sm p-4",
          rarityStyles[rarity],
          hoverable && "transition-all duration-300 hover:-translate-y-1",
          className
        )}
        {...props}
      >
        {/* Rarity badge */}
        <div
          className={cn(
            "absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
            rarity === "common" && "bg-gray-600 text-white",
            rarity === "uncommon" && "bg-green-500 text-black",
            rarity === "rare" && "bg-blue-500 text-white",
            rarity === "epic" && "bg-purple-500 text-white",
            rarity === "legendary" && "bg-gradient-to-r from-amber-500 to-orange-500 text-black",
            rarity === "mythic" && "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white"
          )}
        >
          {rarity}
        </div>
        {children}
      </div>
    );
  }
);

RarityCard.displayName = "RarityCard";
