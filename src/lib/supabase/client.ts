// ============================================
// Supabase Client Configuration
// ============================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ============================================
// Environment Variables
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============================================
// Client Singleton
// ============================================

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase environment variables not configured. Social features will use mock data."
    );
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseClient;
}

// ============================================
// Server-side Client (for API routes)
// ============================================

export function createServerClient(
  cookieStore?: {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  }
) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    ...(cookieStore && {
      global: {
        headers: {
          cookie: cookieStore.get("sb-access-token")?.value || "",
        },
      },
    }),
  });
}

// ============================================
// Auth Helpers
// ============================================

export async function signInWithWallet(
  address: string,
  message: string,
  signature: string
) {
  const client = getSupabaseClient();
  if (!client) return { error: new Error("Supabase not configured") };

  // Custom SIWE authentication via Edge Function
  const { data, error } = await client.functions.invoke("auth-siwe", {
    body: { address, message, signature },
  });

  if (error) {
    return { error };
  }

  // Set the session from the response
  if (data?.access_token) {
    await client.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
  }

  return { data, error: null };
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return { error: new Error("Supabase not configured") };

  return await client.auth.signOut();
}

export async function getSession() {
  const client = getSupabaseClient();
  if (!client) return { data: { session: null }, error: null };

  return await client.auth.getSession();
}

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
) {
  const client = getSupabaseClient();
  if (!client) return { data: { subscription: { unsubscribe: () => {} } } };

  return client.auth.onAuthStateChange(callback);
}

// ============================================
// Realtime Subscriptions
// ============================================

export function subscribeToLeaderboard(
  type: string,
  timeframe: string,
  callback: (payload: unknown) => void
) {
  const client = getSupabaseClient();
  if (!client) return null;

  return client
    .channel(`leaderboard:${type}:${timeframe}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "leaderboard_entries",
        filter: `leaderboard_type=eq.${type}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToFeed(callback: (payload: unknown) => void) {
  const client = getSupabaseClient();
  if (!client) return null;

  return client
    .channel("feed")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "feed_posts",
      },
      callback
    )
    .subscribe();
}

export function subscribeToUserRewards(
  userId: string,
  callback: (payload: unknown) => void
) {
  const client = getSupabaseClient();
  if (!client) return null;

  return client
    .channel(`rewards:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_rewards",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// ============================================
// Type-safe Query Helpers
// ============================================

export const db = {
  profiles: () => getSupabaseClient()?.from("profiles"),
  privacySettings: () => getSupabaseClient()?.from("privacy_settings"),
  tradingStats: () => getSupabaseClient()?.from("trading_stats"),
  badges: () => getSupabaseClient()?.from("badges"),
  leaderboardEntries: () => getSupabaseClient()?.from("leaderboard_entries"),
  referrals: () => getSupabaseClient()?.from("referrals"),
  feedPosts: () => getSupabaseClient()?.from("feed_posts"),
  feedInteractions: () => getSupabaseClient()?.from("feed_interactions"),
  follows: () => getSupabaseClient()?.from("follows"),
  copyTraders: () => getSupabaseClient()?.from("copy_traders"),
  buybackRecords: () => getSupabaseClient()?.from("buyback_records"),
  userRewards: () => getSupabaseClient()?.from("user_rewards"),
  competitions: () => getSupabaseClient()?.from("competitions"),
  competitionParticipants: () => getSupabaseClient()?.from("competition_participants"),
  seasons: () => getSupabaseClient()?.from("seasons"),
};

// ============================================
// RPC Helpers
// ============================================

export async function getLeaderboard(
  type: string,
  timeframe: string,
  limit = 100,
  offset = 0
) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error("Supabase not configured") };

  // Use type assertion for custom RPC functions
  return await (client.rpc as any)("get_leaderboard", {
    p_type: type,
    p_timeframe: timeframe,
    p_limit: limit,
    p_offset: offset,
  });
}

export async function updateTradingStats(profileId: string) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error("Supabase not configured") };

  // Use type assertion for custom RPC functions
  return await (client.rpc as any)("update_trading_stats", {
    p_profile_id: profileId,
  });
}

// ============================================
// Storage Helpers
// ============================================

export async function uploadAvatar(userId: string, file: File) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error("Supabase not configured") };

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await client.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data } = client.storage.from("avatars").getPublicUrl(filePath);

  return { data: { url: data.publicUrl }, error: null };
}

export async function deleteAvatar(filePath: string) {
  const client = getSupabaseClient();
  if (!client) return { error: new Error("Supabase not configured") };

  return await client.storage.from("avatars").remove([filePath]);
}

export { supabaseClient };
