// ============================================
// Profile Validation
// ============================================

import { z } from "zod";

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  "admin",
  "hyperterminal",
  "hyperliquid",
  "system",
  "support",
  "official",
  "mod",
  "moderator",
  "team",
  "staff",
  "help",
  "hype",
  "hypurr",
  "null",
  "undefined",
  "api",
  "www",
  "app",
  "trading",
  "trade",
  "wallet",
  "settings",
  "profile",
  "user",
  "users",
  "account",
  "leaderboard",
  "feed",
  "copy",
  "referral",
  "rewards",
];

// Username schema
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(15, "Username must be at most 15 characters")
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_]*$/,
    "Username must start with a letter and can only contain letters, numbers, and underscores"
  )
  .refine(
    (val) => !RESERVED_USERNAMES.includes(val.toLowerCase()),
    "This username is reserved"
  );

// Display name schema
export const displayNameSchema = z
  .string()
  .min(1, "Display name is required")
  .max(50, "Display name must be at most 50 characters")
  .regex(
    /^[a-zA-Z0-9\s\-_.]+$/,
    "Display name can only contain letters, numbers, spaces, hyphens, underscores, and dots"
  );

// Bio schema
export const bioSchema = z
  .string()
  .max(280, "Bio must be at most 280 characters")
  .optional();

// Social handles
export const twitterSchema = z
  .string()
  .max(15, "Twitter handle must be at most 15 characters")
  .regex(/^[a-zA-Z0-9_]*$/, "Invalid Twitter handle")
  .optional()
  .or(z.literal(""));

export const telegramSchema = z
  .string()
  .max(32, "Telegram handle must be at most 32 characters")
  .regex(/^[a-zA-Z0-9_]*$/, "Invalid Telegram handle")
  .optional()
  .or(z.literal(""));

export const discordSchema = z
  .string()
  .max(37, "Discord handle must be at most 37 characters")
  .optional()
  .or(z.literal(""));

export const websiteSchema = z
  .string()
  .url("Invalid website URL")
  .optional()
  .or(z.literal(""));

// Full profile schema
export const profileSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: bioSchema,
  socials: z
    .object({
      twitter: twitterSchema,
      telegram: telegramSchema,
      discord: discordSchema,
      website: websiteSchema,
    })
    .optional(),
});

// Avatar schema
export const avatarSchema = z.object({
  type: z.enum(["default", "upload", "hypurr", "ens"]),
  url: z.string().url().optional().or(z.literal("")),
  hypurrTokenId: z.number().optional(),
});

// Privacy settings schema
export const privacySchema = z.object({
  showProfile: z.boolean().default(true),
  showPnl: z.boolean().default(true),
  showPositions: z.boolean().default(false),
  showVolume: z.boolean().default(true),
  showOnLeaderboard: z.boolean().default(true),
});

// Create profile schema (for initial profile creation)
export const createProfileSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: bioSchema,
  avatar: avatarSchema,
  socials: z
    .object({
      twitter: twitterSchema,
      telegram: telegramSchema,
      discord: discordSchema,
      website: websiteSchema,
    })
    .optional(),
  privacy: privacySchema,
});

// Update profile schema (partial updates)
export const updateProfileSchema = createProfileSchema.partial();

// Type inference
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Validation helpers
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const result = usernameSchema.safeParse(username);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, error: result.error.issues[0]?.message };
}

export function isUsernameAvailable(username: string): Promise<boolean> {
  // In production, this would check against the database
  // For now, just check against reserved names
  return Promise.resolve(
    !RESERVED_USERNAMES.includes(username.toLowerCase())
  );
}
