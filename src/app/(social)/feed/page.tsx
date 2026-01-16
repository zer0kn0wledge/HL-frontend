"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  Users,
  Zap,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BigNumber from "bignumber.js";

// ============================================
// Mock Data
// ============================================

interface FeedPost {
  id: string;
  author: {
    address: string;
    username: string;
    avatarUrl?: string;
    level: number;
    tier: "standard" | "pro" | "vip";
  };
  type: "trade_share" | "position_update" | "milestone" | "text";
  content: {
    text?: string;
    trade?: {
      market: string;
      side: "long" | "short";
      pnl: string;
      pnlPercent: number;
      entryPrice: string;
      exitPrice: string;
    };
    milestone?: {
      type: string;
      value: string;
      description: string;
    };
  };
  likes: number;
  comments: number;
  reposts: number;
  isLiked: boolean;
  createdAt: Date;
}

const MOCK_POSTS: FeedPost[] = [
  {
    id: "1",
    author: {
      address: "0x1234...5678",
      username: "WhaleTrader",
      level: 45,
      tier: "vip",
    },
    type: "trade_share",
    content: {
      text: "Clean 3R trade on BTC. Waited for the retest and got the perfect entry. Always follow your plan!",
      trade: {
        market: "BTC-PERP",
        side: "long",
        pnl: "12450.50",
        pnlPercent: 45.2,
        entryPrice: "43250",
        exitPrice: "45200",
      },
    },
    likes: 234,
    comments: 45,
    reposts: 12,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: "2",
    author: {
      address: "0xabcd...efgh",
      username: "CryptoNinja",
      level: 32,
      tier: "pro",
    },
    type: "milestone",
    content: {
      milestone: {
        type: "win_streak",
        value: "15",
        description: "15 Winning Trades in a Row!",
      },
    },
    likes: 156,
    comments: 23,
    reposts: 8,
    isLiked: true,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: "3",
    author: {
      address: "0x9876...4321",
      username: "DeFiDegen",
      level: 28,
      tier: "standard",
    },
    type: "text",
    content: {
      text: "Funding rates are extremely negative on ETH right now. Market is overly short - could see a squeeze soon. Loading up my spot bags.",
    },
    likes: 89,
    comments: 34,
    reposts: 5,
    isLiked: false,
    createdAt: new Date(Date.now() - 14400000),
  },
  {
    id: "4",
    author: {
      address: "0xffff...0000",
      username: "LeverageKing",
      level: 67,
      tier: "vip",
    },
    type: "trade_share",
    content: {
      text: "ETH short from the resistance. Clean rejection, took profits at support. Easy 2R.",
      trade: {
        market: "ETH-PERP",
        side: "short",
        pnl: "8750.25",
        pnlPercent: 32.8,
        entryPrice: "2350",
        exitPrice: "2280",
      },
    },
    likes: 178,
    comments: 28,
    reposts: 9,
    isLiked: false,
    createdAt: new Date(Date.now() - 28800000),
  },
];

const TRENDING_TRADERS = [
  { username: "WhaleTrader", pnl: "+$145K", followers: "12.5K" },
  { username: "CryptoNinja", pnl: "+$89K", followers: "8.2K" },
  { username: "BTCMaxi", pnl: "+$67K", followers: "6.1K" },
  { username: "ETHBull", pnl: "+$52K", followers: "4.8K" },
  { username: "DeFiDegen", pnl: "+$41K", followers: "3.9K" },
];

// ============================================
// Components
// ============================================

function TierBadge({ tier }: { tier: "standard" | "pro" | "vip" }) {
  const colors = {
    standard: "bg-muted text-muted-foreground",
    pro: "bg-blue-500/20 text-blue-400",
    vip: "bg-amber-500/20 text-amber-400",
  };

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium uppercase", colors[tier])}>
      {tier}
    </span>
  );
}

function TradeCard({ trade }: { trade: NonNullable<FeedPost["content"]["trade"]> }) {
  const isProfit = new BigNumber(trade.pnl).gt(0);

  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{trade.market}</span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded",
              trade.side === "long"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {trade.side.toUpperCase()}
          </span>
        </div>
        <div className={cn("text-right", isProfit ? "text-emerald-400" : "text-red-400")}>
          <div className="font-mono font-semibold">
            {isProfit ? "+" : ""}${new BigNumber(trade.pnl).toFormat(2)}
          </div>
          <div className="text-xs">
            {isProfit ? "+" : ""}{trade.pnlPercent.toFixed(1)}%
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Entry: ${trade.entryPrice}</span>
        <span>Exit: ${trade.exitPrice}</span>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: NonNullable<FeedPost["content"]["milestone"]> }) {
  return (
    <div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/20">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-semibold">{milestone.description}</div>
          <div className="text-sm text-muted-foreground">{milestone.type}</div>
        </div>
      </div>
    </div>
  );
}

function FeedPostCard({ post }: { post: FeedPost }) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="p-4 border-b border-border hover:bg-muted/30 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold">
          {post.author.username.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{post.author.username}</span>
            <span className="text-xs text-muted-foreground">Lvl {post.author.level}</span>
            <TierBadge tier={post.author.tier} />
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{timeAgo(post.createdAt)}</span>
          </div>

          {/* Content */}
          {post.content.text && (
            <p className="mt-2 text-sm">{post.content.text}</p>
          )}

          {/* Trade Card */}
          {post.content.trade && <TradeCard trade={post.content.trade} />}

          {/* Milestone Card */}
          {post.content.milestone && <MilestoneCard milestone={post.content.milestone} />}

          {/* Actions */}
          <div className="flex items-center gap-6 mt-3">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                isLiked ? "text-red-400" : "text-muted-foreground hover:text-red-400"
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              {likes}
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="h-4 w-4" />
              {post.comments}
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="h-4 w-4" />
              {post.reposts}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendingSidebar() {
  return (
    <div className="space-y-4">
      {/* Trending Traders */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Trending Traders</h3>
        </div>
        <div className="space-y-3">
          {TRENDING_TRADERS.map((trader, i) => (
            <div key={trader.username} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm w-4">{i + 1}</span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-xs font-bold">
                  {trader.username.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{trader.username}</div>
                  <div className="text-xs text-muted-foreground">{trader.followers} followers</div>
                </div>
              </div>
              <span className="text-sm text-emerald-400 font-mono">{trader.pnl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold">Live Activity</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active traders</span>
            <span className="font-mono">2,847</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trades today</span>
            <span className="font-mono">45.2K</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume 24h</span>
            <span className="font-mono">$1.2B</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function FeedPage() {
  const { isConnected } = useAccount();

  return (
    <div className="flex h-screen">
      {/* Main Feed */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold">Feed</h1>
          </div>
          <Tabs defaultValue="following" className="px-4">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-10">
              <TabsTrigger value="following" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Following
              </TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Recent
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Post Composer */}
        {isConnected && (
          <div className="p-4 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold">
                ?
              </div>
              <div className="flex-1">
                <div className="p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:bg-muted/70 transition-colors">
                  <span className="text-sm text-muted-foreground">Share your trade or thoughts...</span>
                </div>
                <div className="flex justify-end mt-2">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        <ScrollArea className="flex-1">
          {MOCK_POSTS.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </ScrollArea>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-80 p-4">
        <TrendingSidebar />
      </div>
    </div>
  );
}
