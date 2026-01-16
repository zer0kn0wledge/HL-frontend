"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// ============================================
// Types
// ============================================
type TradeButtonVariant = "long" | "short" | "neutral";
type TradeButtonSize = "sm" | "md" | "lg";

interface TradeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TradeButtonVariant;
  size?: TradeButtonSize;
  loading?: boolean;
  glowing?: boolean;
}

// ============================================
// Variant Styles
// ============================================
const variantStyles: Record<TradeButtonVariant, string> = {
  long: cn(
    "bg-green-500 hover:bg-green-400 text-black font-bold",
    "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
    "hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]",
    "active:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
  ),
  short: cn(
    "bg-red-500 hover:bg-red-400 text-white font-bold",
    "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    "hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]",
    "active:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
  ),
  neutral: cn(
    "bg-[#50E3C2] hover:bg-[#7FFFDE] text-black font-bold",
    "shadow-[0_0_20px_rgba(80,227,194,0.4)]",
    "hover:shadow-[0_0_30px_rgba(80,227,194,0.6)]",
    "active:shadow-[0_0_15px_rgba(80,227,194,0.3)]"
  ),
};

const sizeStyles: Record<TradeButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-base rounded-lg",
  lg: "px-6 py-4 text-lg rounded-xl",
};

// ============================================
// TradeButton Component
// ============================================
export const TradeButton = forwardRef<HTMLButtonElement, TradeButtonProps>(
  (
    {
      className,
      children,
      variant = "neutral",
      size = "md",
      loading = false,
      glowing = true,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative transition-all duration-200",
          "transform hover:scale-[1.02] active:scale-[0.98]",
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && "opacity-50 cursor-not-allowed hover:scale-100",
          !glowing && "shadow-none hover:shadow-none",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

TradeButton.displayName = "TradeButton";

// ============================================
// Side Toggle Component
// ============================================
type Side = "long" | "short";

interface SideToggleProps {
  value: Side;
  onChange: (side: Side) => void;
  disabled?: boolean;
  className?: string;
}

export function SideToggle({
  value,
  onChange,
  disabled = false,
  className,
}: SideToggleProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <button
        className={cn(
          "flex-1 py-3 rounded-lg font-bold text-lg transition-all duration-200",
          "transform hover:scale-[1.02] active:scale-[0.98]",
          value === "long"
            ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            : "bg-[#111827] text-gray-400 hover:text-white hover:bg-[#1f2937]",
          disabled && "opacity-50 cursor-not-allowed hover:scale-100"
        )}
        onClick={() => !disabled && onChange("long")}
        disabled={disabled}
      >
        🚀 Long
      </button>
      <button
        className={cn(
          "flex-1 py-3 rounded-lg font-bold text-lg transition-all duration-200",
          "transform hover:scale-[1.02] active:scale-[0.98]",
          value === "short"
            ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            : "bg-[#111827] text-gray-400 hover:text-white hover:bg-[#1f2937]",
          disabled && "opacity-50 cursor-not-allowed hover:scale-100"
        )}
        onClick={() => !disabled && onChange("short")}
        disabled={disabled}
      >
        📉 Short
      </button>
    </div>
  );
}

// ============================================
// Order Type Tabs Component
// ============================================
type OrderType = "market" | "limit" | "stop" | "twap";

interface OrderTypeTabs {
  value: OrderType;
  onChange: (type: OrderType) => void;
  className?: string;
}

export function OrderTypeTabs({ value, onChange, className }: OrderTypeTabs) {
  const types: OrderType[] = ["market", "limit", "stop", "twap"];

  return (
    <div
      className={cn(
        "flex gap-1 p-1 rounded-lg bg-black/50 border border-white/5",
        className
      )}
    >
      {types.map((type) => (
        <button
          key={type}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-md transition-all",
            value === type
              ? "bg-[#50E3C2] text-black"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
          onClick={() => onChange(type)}
        >
          {type.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Quick Percentage Buttons
// ============================================
interface QuickPercentButtonsProps {
  onSelect: (percent: number) => void;
  className?: string;
}

export function QuickPercentButtons({
  onSelect,
  className,
}: QuickPercentButtonsProps) {
  const percentages = [25, 50, 75, 100];

  return (
    <div className={cn("flex gap-1", className)}>
      {percentages.map((pct) => (
        <button
          key={pct}
          className={cn(
            "flex-1 py-1.5 text-xs rounded",
            "bg-[#111827] text-gray-400",
            "hover:text-white hover:bg-white/5",
            "transition-all duration-200"
          )}
          onClick={() => onSelect(pct)}
        >
          {pct}%
        </button>
      ))}
    </div>
  );
}

// ============================================
// Leverage Slider Component
// ============================================
interface LeverageSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function LeverageSlider({
  value,
  onChange,
  min = 1,
  max = 50,
  className,
}: LeverageSliderProps) {
  const quickValues = [1, 5, 10, 25, 50];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Leverage</span>
        <span className="text-lg font-bold text-[#50E3C2]">{value}x</span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={cn(
            "w-full h-2 rounded-full appearance-none cursor-pointer",
            "bg-[#1f2937]",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-[#50E3C2]",
            "[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(80,227,194,0.5)]",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:transition-all",
            "[&::-webkit-slider-thumb]:hover:scale-110"
          )}
          style={{
            background: `linear-gradient(to right, #50E3C2 0%, #50E3C2 ${
              ((value - min) / (max - min)) * 100
            }%, #1f2937 ${((value - min) / (max - min)) * 100}%, #1f2937 100%)`,
          }}
        />
      </div>

      {/* Quick leverage buttons */}
      <div className="flex gap-1">
        {quickValues.map((lev) => (
          <button
            key={lev}
            className={cn(
              "flex-1 py-1 text-xs rounded transition-all",
              value === lev
                ? "bg-[#50E3C2] text-black font-bold"
                : "bg-[#111827] text-gray-400 hover:text-white"
            )}
            onClick={() => onChange(lev)}
          >
            {lev}x
          </button>
        ))}
      </div>
    </div>
  );
}
