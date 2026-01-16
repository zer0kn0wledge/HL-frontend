"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  TrendingUp,
  User,
  Settings,
  LogOut,
  Trophy,
  Target,
  Users,
  MessageSquare,
  BarChart3,
  Wallet,
  Search,
  Home,
  Zap,
  Award,
  BookOpen,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAppStore, useSettingsStore } from "@/store";

// ============================================
// Command Types
// ============================================

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  group: "navigation" | "trading" | "social" | "gamification" | "settings" | "wallet";
}

// ============================================
// Command Palette Component
// ============================================

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { open: openWallet } = useAppKit();
  const { setCurrentMarket, setSettingsOpen } = useAppStore();

  // Listen for keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Define commands
  const commands: CommandAction[] = [
    // Navigation
    {
      id: "home",
      label: "Go to Trading",
      icon: <Home className="h-4 w-4" />,
      shortcut: "⌘H",
      action: () => router.push("/"),
      keywords: ["home", "trade", "main"],
      group: "navigation",
    },
    {
      id: "feed",
      label: "Go to Feed",
      icon: <MessageSquare className="h-4 w-4" />,
      action: () => router.push("/feed"),
      keywords: ["social", "posts", "community"],
      group: "navigation",
    },
    {
      id: "leaderboard",
      label: "Go to Leaderboard",
      icon: <Trophy className="h-4 w-4" />,
      action: () => router.push("/leaderboard"),
      keywords: ["rankings", "top traders"],
      group: "navigation",
    },
    {
      id: "achievements",
      label: "Go to Achievements",
      icon: <Award className="h-4 w-4" />,
      action: () => router.push("/achievements"),
      keywords: ["badges", "unlocks"],
      group: "navigation",
    },
    {
      id: "challenges",
      label: "Go to Challenges",
      icon: <Target className="h-4 w-4" />,
      action: () => router.push("/challenges"),
      keywords: ["daily", "missions", "tasks"],
      group: "navigation",
    },

    // Trading
    {
      id: "btc",
      label: "Trade BTC-PERP",
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => {
        setCurrentMarket("perp", "BTC");
        router.push("/");
      },
      keywords: ["bitcoin"],
      group: "trading",
    },
    {
      id: "eth",
      label: "Trade ETH-PERP",
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => {
        setCurrentMarket("perp", "ETH");
        router.push("/");
      },
      keywords: ["ethereum"],
      group: "trading",
    },
    {
      id: "sol",
      label: "Trade SOL-PERP",
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => {
        setCurrentMarket("perp", "SOL");
        router.push("/");
      },
      keywords: ["solana"],
      group: "trading",
    },

    // Wallet
    {
      id: "connect",
      label: isConnected ? "Wallet Connected" : "Connect Wallet",
      icon: <Wallet className="h-4 w-4" />,
      action: () => openWallet(),
      keywords: ["wallet", "metamask", "web3"],
      group: "wallet",
    },

    // Settings
    {
      id: "settings",
      label: "Open Settings",
      icon: <Settings className="h-4 w-4" />,
      shortcut: "⌘,",
      action: () => setSettingsOpen(true),
      keywords: ["preferences", "config"],
      group: "settings",
    },
  ];

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            {commands
              .filter((c) => c.group === "navigation")
              .map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => runCommand(command.action)}
                  className="flex items-center gap-2"
                >
                  {command.icon}
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Trading */}
          <CommandGroup heading="Quick Trade">
            {commands
              .filter((c) => c.group === "trading")
              .map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => runCommand(command.action)}
                  className="flex items-center gap-2"
                >
                  {command.icon}
                  <span>{command.label}</span>
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Wallet */}
          <CommandGroup heading="Wallet">
            {commands
              .filter((c) => c.group === "wallet")
              .map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => runCommand(command.action)}
                  className="flex items-center gap-2"
                >
                  {command.icon}
                  <span>{command.label}</span>
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Settings */}
          <CommandGroup heading="Settings">
            {commands
              .filter((c) => c.group === "settings")
              .map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => runCommand(command.action)}
                  className="flex items-center gap-2"
                >
                  {command.icon}
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
    </CommandDialog>
  );
}

// ============================================
// Keyboard Shortcuts Hook
// ============================================

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { setCurrentMarket } = useAppStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Global shortcuts (no modifier)
      switch (e.key) {
        case "1":
          setCurrentMarket("perp", "BTC");
          break;
        case "2":
          setCurrentMarket("perp", "ETH");
          break;
        case "3":
          setCurrentMarket("perp", "SOL");
          break;
      }

      // Shortcuts with modifiers
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "h":
            e.preventDefault();
            router.push("/");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, setCurrentMarket]);
}
