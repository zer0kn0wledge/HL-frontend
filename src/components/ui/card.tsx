"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <div className={cn("rounded-lg border border-zinc-800 bg-zinc-900", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          {title && <h3 className="text-sm font-medium text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
