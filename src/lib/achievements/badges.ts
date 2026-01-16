// ============================================
// Achievement Badge Definitions
// ============================================

import type { Badge, BadgeRarity } from "@/types/social";

// Rarity colors for UI
export const BADGE_RARITY_COLORS: Record<BadgeRarity, string> = {
  common: "from-gray-400 to-gray-500",
  uncommon: "from-green-400 to-green-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-orange-500",
};

export const BADGE_RARITY_GLOW: Record<BadgeRarity, string> = {
  common: "shadow-gray-500/20",
  uncommon: "shadow-green-500/30",
  rare: "shadow-blue-500/30",
  epic: "shadow-purple-500/40",
  legendary: "shadow-yellow-500/50",
};

// All badge definitions
export const BADGES: Record<string, Badge> = {
  // === TRADING ACHIEVEMENTS ===
  first_trade: {
    id: "first_trade",
    name: "First Blood",
    description: "Complete your first trade on HyperTerminal",
    icon: "🩸",
    rarity: "common",
    category: "trading",
  },
  profitable_week: {
    id: "profitable_week",
    name: "Green Week",
    description: "End a week in profit",
    icon: "📈",
    rarity: "common",
    category: "trading",
  },
  profitable_month: {
    id: "profitable_month",
    name: "Green Month",
    description: "End a month in profit",
    icon: "📊",
    rarity: "uncommon",
    category: "trading",
  },
  diamond_hands: {
    id: "diamond_hands",
    name: "Diamond Hands",
    description: "Hold a position through 20%+ drawdown to profit",
    icon: "💎",
    rarity: "rare",
    category: "trading",
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    description: "Close 10 trades with 50%+ profit each",
    icon: "🎯",
    rarity: "epic",
    category: "trading",
  },
  ten_x: {
    id: "ten_x",
    name: "10x Club",
    description: "10x your account on a single position",
    icon: "🚀",
    rarity: "legendary",
    category: "trading",
    hidden: true,
  },
  liquidation_survivor: {
    id: "liquidation_survivor",
    name: "Survivor",
    description: "Avoid liquidation within 1% of liq price",
    icon: "🛡️",
    rarity: "rare",
    category: "trading",
  },
  early_bird: {
    id: "early_bird",
    name: "Early Bird",
    description: "Execute a trade within 1 minute of market open",
    icon: "🐦",
    rarity: "uncommon",
    category: "trading",
  },
  night_owl: {
    id: "night_owl",
    name: "Night Owl",
    description: "Trade during overnight hours (12am-6am)",
    icon: "🦉",
    rarity: "common",
    category: "trading",
  },
  volatility_master: {
    id: "volatility_master",
    name: "Volatility Master",
    description: "Profit during a 10%+ daily market move",
    icon: "🌊",
    rarity: "rare",
    category: "trading",
  },

  // === STREAK ACHIEVEMENTS ===
  win_streak_5: {
    id: "win_streak_5",
    name: "On Fire",
    description: "5 winning trades in a row",
    icon: "🔥",
    rarity: "uncommon",
    category: "streak",
  },
  win_streak_10: {
    id: "win_streak_10",
    name: "Unstoppable",
    description: "10 winning trades in a row",
    icon: "⚡",
    rarity: "rare",
    category: "streak",
  },
  win_streak_20: {
    id: "win_streak_20",
    name: "Legendary Streak",
    description: "20 winning trades in a row",
    icon: "👑",
    rarity: "legendary",
    category: "streak",
    hidden: true,
  },
  comeback_king: {
    id: "comeback_king",
    name: "Comeback King",
    description: "Recover from 5+ losing streak to 5+ winning streak",
    icon: "👊",
    rarity: "epic",
    category: "streak",
  },

  // === VOLUME MILESTONES ===
  volume_100k: {
    id: "volume_100k",
    name: "Bronze Trader",
    description: "Trade $100K in volume",
    icon: "🥉",
    rarity: "common",
    category: "volume",
    requirement: "$100,000 volume",
  },
  volume_1m: {
    id: "volume_1m",
    name: "Silver Trader",
    description: "Trade $1M in volume",
    icon: "🥈",
    rarity: "uncommon",
    category: "volume",
    requirement: "$1,000,000 volume",
  },
  volume_10m: {
    id: "volume_10m",
    name: "Gold Trader",
    description: "Trade $10M in volume",
    icon: "🥇",
    rarity: "rare",
    category: "volume",
    requirement: "$10,000,000 volume",
  },
  volume_100m: {
    id: "volume_100m",
    name: "Platinum Trader",
    description: "Trade $100M in volume",
    icon: "💠",
    rarity: "epic",
    category: "volume",
    requirement: "$100,000,000 volume",
  },
  volume_1b: {
    id: "volume_1b",
    name: "Diamond Trader",
    description: "Trade $1B in volume",
    icon: "💎",
    rarity: "legendary",
    category: "volume",
    requirement: "$1,000,000,000 volume",
    hidden: true,
  },

  // === SOCIAL ===
  profile_complete: {
    id: "profile_complete",
    name: "Identity",
    description: "Complete your profile with username, bio, and avatar",
    icon: "🪪",
    rarity: "common",
    category: "social",
  },
  first_follower: {
    id: "first_follower",
    name: "Leader",
    description: "Get your first copy trading follower",
    icon: "👤",
    rarity: "uncommon",
    category: "social",
  },
  ten_followers: {
    id: "ten_followers",
    name: "Rising Star",
    description: "Get 10 copy trading followers",
    icon: "⭐",
    rarity: "rare",
    category: "social",
  },
  hundred_followers: {
    id: "hundred_followers",
    name: "Trading Guru",
    description: "Get 100 copy trading followers",
    icon: "🧙",
    rarity: "epic",
    category: "social",
  },
  influencer: {
    id: "influencer",
    name: "Influencer",
    description: "100+ profile views",
    icon: "📣",
    rarity: "rare",
    category: "social",
  },
  referral_10: {
    id: "referral_10",
    name: "Connector",
    description: "Refer 10 active traders",
    icon: "🔗",
    rarity: "rare",
    category: "social",
  },
  referral_50: {
    id: "referral_50",
    name: "Ambassador",
    description: "Refer 50 active traders",
    icon: "🎖️",
    rarity: "epic",
    category: "social",
  },
  first_post: {
    id: "first_post",
    name: "Vocal",
    description: "Share your first trade on the feed",
    icon: "💬",
    rarity: "common",
    category: "social",
  },

  // === SPECIAL ===
  og: {
    id: "og",
    name: "OG",
    description: "Among the first 1,000 HyperTerminal users",
    icon: "⭐",
    rarity: "legendary",
    category: "special",
  },
  hypurr_holder: {
    id: "hypurr_holder",
    name: "Hypurr Holder",
    description: "Own a HypurrNFT",
    icon: "🐱",
    rarity: "epic",
    category: "special",
  },
  bug_hunter: {
    id: "bug_hunter",
    name: "Bug Hunter",
    description: "Report a valid bug",
    icon: "🐛",
    rarity: "rare",
    category: "special",
  },
  beta_tester: {
    id: "beta_tester",
    name: "Beta Tester",
    description: "Participated in beta testing",
    icon: "🧪",
    rarity: "rare",
    category: "special",
  },
  whale: {
    id: "whale",
    name: "Whale",
    description: "Hold $1M+ in account value",
    icon: "🐋",
    rarity: "legendary",
    category: "special",
    hidden: true,
  },

  // === SEASONAL ===
  season_champion: {
    id: "season_champion",
    name: "Season Champion",
    description: "Win first place in a season",
    icon: "🏆",
    rarity: "legendary",
    category: "seasonal",
  },
  season_silver: {
    id: "season_silver",
    name: "Silver Medalist",
    description: "Place 2nd in a season",
    icon: "🥈",
    rarity: "epic",
    category: "seasonal",
  },
  season_bronze: {
    id: "season_bronze",
    name: "Bronze Medalist",
    description: "Place 3rd in a season",
    icon: "🥉",
    rarity: "epic",
    category: "seasonal",
  },
  season_top10: {
    id: "season_top10",
    name: "Top 10",
    description: "Finish in the top 10 of a season",
    icon: "🔟",
    rarity: "rare",
    category: "seasonal",
  },
  season_top100: {
    id: "season_top100",
    name: "Top 100",
    description: "Finish in the top 100 of a season",
    icon: "💯",
    rarity: "uncommon",
    category: "seasonal",
  },
  season_participant: {
    id: "season_participant",
    name: "Season Veteran",
    description: "Participate in a competitive season",
    icon: "🏅",
    rarity: "common",
    category: "seasonal",
  },
};

// Get badge by ID
export function getBadge(id: string): Badge | undefined {
  return BADGES[id];
}

// Get all badges by category
export function getBadgesByCategory(category: Badge["category"]): Badge[] {
  return Object.values(BADGES).filter((badge) => badge.category === category);
}

// Get all visible badges (non-hidden)
export function getVisibleBadges(): Badge[] {
  return Object.values(BADGES).filter((badge) => !badge.hidden);
}

// Get all badges
export function getAllBadges(): Badge[] {
  return Object.values(BADGES);
}
