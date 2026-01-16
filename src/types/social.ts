// ============================================
// Social Features Type Definitions
// ============================================

import type { Address } from "viem";
import type { FeeTier } from "@/lib/fees/constants";

// ============================================
// Profile Types
// ============================================

export interface HyperID {
  // Identity
  address: Address;
  username: string; // Unique, 3-15 chars, alphanumeric + underscore
  displayName: string; // 1-50 chars
  bio: string; // Max 280 chars

  // Avatar
  avatar: {
    type: "default" | "upload" | "hypurr" | "ens";
    url: string;
    hypurrTokenId?: number; // If using Hypurr NFT as PFP
  };

  // Social links
  socials: {
    twitter?: string; // Handle without @
    telegram?: string;
    discord?: string;
    website?: string;
  };

  // Privacy settings
  privacy: {
    showProfile: boolean; // Public profile
    showPnl: boolean; // Show PnL on profile
    showPositions: boolean; // Show current positions
    showVolume: boolean; // Show trading volume
    showOnLeaderboard: boolean; // Appear on leaderboards
  };

  // Stats (computed, read-only)
  stats: ProfileStats;

  // Achievements
  badges: Badge[];

  // Tier
  tier: FeeTier;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileStats {
  // All-time
  totalVolume: string;
  totalTrades: number;
  totalPnl: string;
  winRate: number; // Percentage
  avgTradeSize: string;
  avgLeverage: number;

  // 30-day
  volume30d: string;
  pnl30d: string;
  trades30d: number;

  // Rankings
  volumeRank?: number;
  pnlRank?: number;

  // Streaks
  currentWinStreak: number;
  bestWinStreak: number;

  // Activity
  memberSince: Date;
  lastTradeAt?: Date;
  favoriteMarket: string;
}

// ============================================
// Badge/Achievement Types
// ============================================

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type BadgeCategory =
  | "trading"
  | "volume"
  | "streak"
  | "social"
  | "special"
  | "seasonal";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  rarity: BadgeRarity;
  category: BadgeCategory;
  requirement?: string; // Human-readable requirement
  hidden?: boolean; // Don't show until earned
  earnedAt?: Date; // When user earned it
}

// ============================================
// Leaderboard Types
// ============================================

export type LeaderboardType =
  | "pnl" // Total PnL
  | "pnl_percent" // PnL as % of starting balance
  | "volume" // Trading volume
  | "win_rate" // Win percentage (min 50 trades)
  | "streak" // Current win streak
  | "degen"; // Highest avg leverage

export type LeaderboardTimeframe =
  | "daily"
  | "weekly"
  | "monthly"
  | "season" // 3-month competitive season
  | "all_time";

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  rankChange: number; // positive = moved up, negative = moved down

  user: {
    address: Address;
    username?: string;
    displayName?: string;
    avatar?: string;
    tier: FeeTier;
    badges: Badge[];
  };

  metric: {
    type: LeaderboardType;
    value: string;
    formatted: string; // For display
  };

  additionalStats?: {
    trades: number;
    winRate: number;
    avgLeverage: number;
  };
}

export interface LeaderboardResponse {
  type: LeaderboardType;
  timeframe: LeaderboardTimeframe;
  entries: LeaderboardEntry[];
  totalParticipants: number;
  userRank?: LeaderboardEntry; // Current user's position
  updatedAt: Date;
}

// ============================================
// Season Types
// ============================================

export interface Season {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "active" | "ended";

  rewards: {
    rank: number;
    hypeAmount: string;
    badge: Badge;
  }[];

  stats?: {
    totalParticipants: number;
    totalVolume: string;
    prizePool: string;
  };
}

// ============================================
// Social Feed Types
// ============================================

export type FeedPostType =
  | "trade_opened"
  | "trade_closed"
  | "position_liquidated"
  | "achievement_earned"
  | "rank_changed"
  | "thought"; // Text post / market commentary

export interface FeedPost {
  id: string;
  author: {
    address: Address;
    profile: HyperID;
  };
  type: FeedPostType;
  content: FeedPostContent;

  // Engagement
  likes: number;
  comments: number;
  shares: number;

  // User interaction state
  userLiked?: boolean;

  createdAt: Date;
}

export type FeedPostContent =
  | TradePostContent
  | AchievementPostContent
  | RankPostContent
  | ThoughtPostContent;

export interface TradePostContent {
  type: "trade_opened" | "trade_closed" | "position_liquidated";
  market: string;
  side: "long" | "short";
  size: string;
  entryPrice: string;
  exitPrice?: string;
  pnl?: string;
  pnlPercent?: number;
  leverage: number;
  comment?: string; // Optional user commentary
}

export interface AchievementPostContent {
  type: "achievement_earned";
  badge: Badge;
}

export interface RankPostContent {
  type: "rank_changed";
  leaderboard: LeaderboardType;
  oldRank: number;
  newRank: number;
}

export interface ThoughtPostContent {
  type: "thought";
  text: string;
  market?: string; // Optional market reference
  attachments?: string[]; // Image URLs
}

// ============================================
// Copy Trading Types
// ============================================

export interface CopyTrader {
  address: Address;
  profile: HyperID;

  // Performance
  stats: {
    pnl30d: string;
    pnlPercent30d: number;
    winRate: number;
    avgTradeSize: string;
    avgHoldTime: number; // Minutes
    maxDrawdown: number;
    sharpeRatio: number;
  };

  // Copy settings
  copyConfig: {
    enabled: boolean;
    minFollowerEquity: string; // Min $$ to follow
    maxFollowers: number;
    profitShare: number; // % of profits to leader (5-30%)
    allowedMarkets: string[]; // 'all' or specific markets
    maxLeverage: number;
  };

  // Followers
  followers: {
    count: number;
    totalAum: string; // Total assets under management
    totalProfitPaid: string; // Total profit share paid
  };
}

export interface CopyPosition {
  id: string;
  follower: Address;
  leader: Address;

  // Allocation
  allocation: {
    maxEquity: string; // Max equity to use
    currentEquity: string; // Current allocated equity
    profitLoss: string;
  };

  // Settings
  settings: {
    maxPerTrade: string; // Max per single trade
    maxLeverage: number; // Cap leverage
    copySpot: boolean; // Copy spot trades
    copyPerps: boolean; // Copy perps trades
    copyHip3: boolean; // Copy HIP-3 trades
    stopLossPercent: number; // Auto-stop if down X%
  };

  // Status
  status: "active" | "paused" | "stopped";
  createdAt: Date;
  lastCopiedAt?: Date;
}

// ============================================
// Referral Types
// ============================================

export interface ReferralConfig {
  tier1Commission: number; // 20% of referee's builder fees
  tier2Commission: number; // 5% from referee's referrals
  refereeDiscount: number; // 10% fee discount
  refereeDiscountDuration: number; // 30 days
  minVolumeForCommission: number; // $1000 min volume to earn
}

export interface ReferralStats {
  code: string;
  referralLink: string;

  // Referrals
  tier1Referrals: number; // Direct referrals
  tier2Referrals: number; // Referrals of referrals
  activeReferrals: number; // Active in last 30 days

  // Earnings
  totalEarnings: string; // All-time USDC
  pendingEarnings: string; // Unpaid
  paidEarnings: string; // Already claimed

  // This month
  monthlyEarnings: string;
  monthlyVolume: string; // Volume from referrals
}

export interface Referral {
  referee: Address;
  referrer: Address;
  tier: 1 | 2;

  joinedAt: Date;
  firstTradeAt?: Date;

  stats: {
    volume: string;
    trades: number;
    commissionPaid: string;
  };
}

// ============================================
// Buyback Types
// ============================================

export interface BuybackConfig {
  minBuybackThreshold: number; // Min $1000 USDC before buyback
  buybackFrequency: "daily";
  maxSlippage: number; // 0.5% max slippage

  distribution: {
    userRewards: number; // 70% to users
    treasury: number; // 30% to treasury
  };

  hypeSpotPair: string;
  hypeAssetId: number;
  treasuryAddress: Address;

  rewardDistributionFrequency: "weekly";
  minVolumeForRewards: number; // Min $10k volume to qualify
}

export interface BuybackRecord {
  id: string;
  timestamp: number;
  usdcSpent: string;
  hypeReceived: string;
  avgPrice: string;
  txHash: string;
  distribution: {
    toUsers: string;
    toTreasury: string;
  };
}

export interface BuybackStats {
  totalHypeBought: string;
  totalUsdValue: string;
  distributedToUsers: string;
  treasuryBalance: string;
  averagePrice: string;
  totalBuybacks: number;
}

export interface UserReward {
  address: Address;
  weekStart: Date;
  volume: string;
  volumeShare: number;
  hypeReward: string;
  status: "pending" | "distributed";
  distributedAt?: Date;
}

// ============================================
// Competition Types
// ============================================

export interface Competition {
  id: string;
  name: string;
  description: string;

  // Timing
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "active" | "ended";

  // Rules
  rules: {
    metric: LeaderboardType;
    markets?: string[]; // Specific markets only, or all
    minTrades?: number;
    minVolume?: string;
    maxLeverage?: number;
  };

  // Prizes
  prizes: {
    rank: number | [number, number]; // Single rank or range
    reward: {
      type: "hype" | "badge" | "fee_discount";
      amount?: string;
      badge?: Badge;
      discountPercent?: number;
      discountDuration?: number; // Days
    };
  }[];

  // Participants
  participants: number;
  totalPrizePool?: string;
}
