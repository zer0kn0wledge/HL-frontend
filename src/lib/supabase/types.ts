// ============================================
// Supabase Database Types
// Auto-generated from database schema
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// Database Schema
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          address: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          avatar_nft_id: number | null;
          twitter_handle: string | null;
          discord_handle: string | null;
          telegram_handle: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
          is_verified: boolean;
          tier: "standard" | "pro" | "vip";
          tier_reason: "default" | "volume" | "hypurr_nft";
        };
        Insert: {
          id?: string;
          address: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          avatar_nft_id?: number | null;
          twitter_handle?: string | null;
          discord_handle?: string | null;
          telegram_handle?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
          is_verified?: boolean;
          tier?: "standard" | "pro" | "vip";
          tier_reason?: "default" | "volume" | "hypurr_nft";
        };
        Update: {
          id?: string;
          address?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          avatar_nft_id?: number | null;
          twitter_handle?: string | null;
          discord_handle?: string | null;
          telegram_handle?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
          is_verified?: boolean;
          tier?: "standard" | "pro" | "vip";
          tier_reason?: "default" | "volume" | "hypurr_nft";
        };
      };
      privacy_settings: {
        Row: {
          id: string;
          profile_id: string;
          show_profile: boolean;
          show_pnl: boolean;
          show_positions: boolean;
          show_volume: boolean;
          show_on_leaderboard: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          show_profile?: boolean;
          show_pnl?: boolean;
          show_positions?: boolean;
          show_volume?: boolean;
          show_on_leaderboard?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          show_profile?: boolean;
          show_pnl?: boolean;
          show_positions?: boolean;
          show_volume?: boolean;
          show_on_leaderboard?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      trading_stats: {
        Row: {
          id: string;
          profile_id: string;
          total_trades: number;
          total_volume: string;
          total_pnl: string;
          win_rate: number;
          best_trade_pnl: string;
          worst_trade_pnl: string;
          avg_trade_size: string;
          avg_hold_time: number;
          monthly_volume: string;
          weekly_volume: string;
          daily_volume: string;
          period_start: string;
          period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          total_trades?: number;
          total_volume?: string;
          total_pnl?: string;
          win_rate?: number;
          best_trade_pnl?: string;
          worst_trade_pnl?: string;
          avg_trade_size?: string;
          avg_hold_time?: number;
          monthly_volume?: string;
          weekly_volume?: string;
          daily_volume?: string;
          period_start: string;
          period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          total_trades?: number;
          total_volume?: string;
          total_pnl?: string;
          win_rate?: number;
          best_trade_pnl?: string;
          worst_trade_pnl?: string;
          avg_trade_size?: string;
          avg_hold_time?: number;
          monthly_volume?: string;
          weekly_volume?: string;
          daily_volume?: string;
          period_start?: string;
          period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          profile_id: string;
          badge_id: string;
          earned_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          badge_id: string;
          earned_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          badge_id?: string;
          earned_at?: string;
          metadata?: Json | null;
        };
      };
      leaderboard_entries: {
        Row: {
          id: string;
          profile_id: string;
          leaderboard_type: "pnl" | "volume" | "win_rate" | "trades" | "streak";
          timeframe: "daily" | "weekly" | "monthly" | "all_time" | "season";
          rank: number;
          value: string;
          previous_rank: number | null;
          period_start: string;
          period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          leaderboard_type: "pnl" | "volume" | "win_rate" | "trades" | "streak";
          timeframe: "daily" | "weekly" | "monthly" | "all_time" | "season";
          rank: number;
          value: string;
          previous_rank?: number | null;
          period_start: string;
          period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          leaderboard_type?: "pnl" | "volume" | "win_rate" | "trades" | "streak";
          timeframe?: "daily" | "weekly" | "monthly" | "all_time" | "season";
          rank?: number;
          value?: string;
          previous_rank?: number | null;
          period_start?: string;
          period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referee_id: string;
          code: string;
          status: "pending" | "active" | "expired";
          volume_generated: string;
          rewards_earned: string;
          created_at: string;
          activated_at: string | null;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referee_id: string;
          code: string;
          status?: "pending" | "active" | "expired";
          volume_generated?: string;
          rewards_earned?: string;
          created_at?: string;
          activated_at?: string | null;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referee_id?: string;
          code?: string;
          status?: "pending" | "active" | "expired";
          volume_generated?: string;
          rewards_earned?: string;
          created_at?: string;
          activated_at?: string | null;
        };
      };
      feed_posts: {
        Row: {
          id: string;
          author_id: string;
          content_type: "trade_share" | "position_update" | "milestone" | "text" | "poll";
          content: Json;
          likes_count: number;
          comments_count: number;
          reposts_count: number;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          content_type: "trade_share" | "position_update" | "milestone" | "text" | "poll";
          content: Json;
          likes_count?: number;
          comments_count?: number;
          reposts_count?: number;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          content_type?: "trade_share" | "position_update" | "milestone" | "text" | "poll";
          content?: Json;
          likes_count?: number;
          comments_count?: number;
          reposts_count?: number;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      feed_interactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          interaction_type: "like" | "comment" | "repost";
          comment_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          interaction_type: "like" | "comment" | "repost";
          comment_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          interaction_type?: "like" | "comment" | "repost";
          comment_text?: string | null;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      copy_traders: {
        Row: {
          id: string;
          copier_id: string;
          trader_id: string;
          allocation: string;
          max_position_size: string;
          copy_leverage: boolean;
          copy_tp_sl: boolean;
          status: "active" | "paused" | "stopped";
          total_pnl: string;
          total_trades: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          copier_id: string;
          trader_id: string;
          allocation: string;
          max_position_size: string;
          copy_leverage?: boolean;
          copy_tp_sl?: boolean;
          status?: "active" | "paused" | "stopped";
          total_pnl?: string;
          total_trades?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          copier_id?: string;
          trader_id?: string;
          allocation?: string;
          max_position_size?: string;
          copy_leverage?: boolean;
          copy_tp_sl?: boolean;
          status?: "active" | "paused" | "stopped";
          total_pnl?: string;
          total_trades?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      buyback_records: {
        Row: {
          id: string;
          timestamp: string;
          fees_collected: string;
          hype_amount: string;
          hype_price: string;
          tx_hash: string;
          user_share: string;
          treasury_share: string;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          fees_collected: string;
          hype_amount: string;
          hype_price: string;
          tx_hash: string;
          user_share: string;
          treasury_share: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          fees_collected?: string;
          hype_amount?: string;
          hype_price?: string;
          tx_hash?: string;
          user_share?: string;
          treasury_share?: string;
        };
      };
      user_rewards: {
        Row: {
          id: string;
          user_id: string;
          amount: string;
          source: "volume_rebate" | "referral" | "competition" | "achievement" | "airdrop";
          timestamp: string;
          claimed: boolean;
          claimed_at: string | null;
          tx_hash: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: string;
          source: "volume_rebate" | "referral" | "competition" | "achievement" | "airdrop";
          timestamp?: string;
          claimed?: boolean;
          claimed_at?: string | null;
          tx_hash?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: string;
          source?: "volume_rebate" | "referral" | "competition" | "achievement" | "airdrop";
          timestamp?: string;
          claimed?: boolean;
          claimed_at?: string | null;
          tx_hash?: string | null;
        };
      };
      competitions: {
        Row: {
          id: string;
          name: string;
          description: string;
          type: "pnl" | "volume" | "roi";
          start_time: string;
          end_time: string;
          prize_pool: string;
          entry_fee: string | null;
          max_participants: number | null;
          rules: Json;
          status: "upcoming" | "active" | "ended";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          type: "pnl" | "volume" | "roi";
          start_time: string;
          end_time: string;
          prize_pool: string;
          entry_fee?: string | null;
          max_participants?: number | null;
          rules: Json;
          status?: "upcoming" | "active" | "ended";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          type?: "pnl" | "volume" | "roi";
          start_time?: string;
          end_time?: string;
          prize_pool?: string;
          entry_fee?: string | null;
          max_participants?: number | null;
          rules?: Json;
          status?: "upcoming" | "active" | "ended";
          created_at?: string;
        };
      };
      competition_participants: {
        Row: {
          id: string;
          competition_id: string;
          profile_id: string;
          rank: number | null;
          score: string;
          prize_won: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          profile_id: string;
          rank?: number | null;
          score?: string;
          prize_won?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          profile_id?: string;
          rank?: number | null;
          score?: string;
          prize_won?: string | null;
          joined_at?: string;
        };
      };
      seasons: {
        Row: {
          id: string;
          number: number;
          name: string;
          theme: string | null;
          start_date: string;
          end_date: string;
          prize_pool: string;
          status: "upcoming" | "active" | "ended";
          created_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          name: string;
          theme?: string | null;
          start_date: string;
          end_date: string;
          prize_pool: string;
          status?: "upcoming" | "active" | "ended";
          created_at?: string;
        };
        Update: {
          id?: string;
          number?: number;
          name?: string;
          theme?: string | null;
          start_date?: string;
          end_date?: string;
          prize_pool?: string;
          status?: "upcoming" | "active" | "ended";
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_leaderboard: {
        Args: {
          p_type: string;
          p_timeframe: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          rank: number;
          profile_id: string;
          username: string;
          display_name: string;
          avatar_url: string;
          tier: string;
          value: string;
          previous_rank: number;
        }[];
      };
      update_trading_stats: {
        Args: {
          p_profile_id: string;
        };
        Returns: void;
      };
      process_buyback: {
        Args: {
          p_fees_collected: string;
          p_hype_amount: string;
          p_hype_price: string;
          p_tx_hash: string;
        };
        Returns: string;
      };
    };
    Enums: {
      tier_type: "standard" | "pro" | "vip";
      tier_reason: "default" | "volume" | "hypurr_nft";
      leaderboard_type: "pnl" | "volume" | "win_rate" | "trades" | "streak";
      timeframe_type: "daily" | "weekly" | "monthly" | "all_time" | "season";
      referral_status: "pending" | "active" | "expired";
      feed_content_type: "trade_share" | "position_update" | "milestone" | "text" | "poll";
      interaction_type: "like" | "comment" | "repost";
      copy_status: "active" | "paused" | "stopped";
      reward_source: "volume_rebate" | "referral" | "competition" | "achievement" | "airdrop";
      competition_type: "pnl" | "volume" | "roi";
      competition_status: "upcoming" | "active" | "ended";
    };
  };
}

// ============================================
// Helper Types
// ============================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type PrivacySettings = Tables<"privacy_settings">;
export type TradingStats = Tables<"trading_stats">;
export type Badge = Tables<"badges">;
export type LeaderboardEntry = Tables<"leaderboard_entries">;
export type Referral = Tables<"referrals">;
export type FeedPost = Tables<"feed_posts">;
export type FeedInteraction = Tables<"feed_interactions">;
export type Follow = Tables<"follows">;
export type CopyTrader = Tables<"copy_traders">;
export type BuybackRecord = Tables<"buyback_records">;
export type UserReward = Tables<"user_rewards">;
export type Competition = Tables<"competitions">;
export type CompetitionParticipant = Tables<"competition_participants">;
export type Season = Tables<"seasons">;
