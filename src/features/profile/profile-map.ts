// ─────────────────────────────────────────────────────────────
// Profile Mapping Helpers
// ─────────────────────────────────────────────────────────────
// Converts between database rows (snake_case) and the public
// Profile contract (camelCase). Also maps validated update
// input to database column names.
// ─────────────────────────────────────────────────────────────

import "server-only";

import type { Profile } from "@/types/profile";
import type { UpdateProfileInput } from "@/lib/validation/profile";

// ── Database row type ──────────────────────────────────────

export type ProfileRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  tagline: string | null;
  bio: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

// ── Database update type ───────────────────────────────────

export type ProfileUpdateRow = {
  name?: string;
  phone?: string;
  location?: string;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  tagline?: string | null;
  bio?: string | null;
  image_url?: string | null;
};

// ── Explicit column selection ──────────────────────────────

export const PROFILE_COLUMNS =
  "id, user_id, name, email, phone, location, github_url, linkedin_url, portfolio_url, tagline, bio, image_url, created_at, updated_at";

// ── Row → Profile ─────────────────────────────────────────

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    tagline: row.tagline,
    bio: row.bio,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── UpdateProfileInput → ProfileUpdateRow ──────────────────

export function toProfileUpdate(input: UpdateProfileInput): ProfileUpdateRow {
  const update: ProfileUpdateRow = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.location !== undefined) update.location = input.location;
  if (input.githubUrl !== undefined) update.github_url = input.githubUrl;
  if (input.linkedinUrl !== undefined) update.linkedin_url = input.linkedinUrl;
  if (input.portfolioUrl !== undefined) update.portfolio_url = input.portfolioUrl;
  if (input.tagline !== undefined) update.tagline = input.tagline;
  if (input.bio !== undefined) update.bio = input.bio;
  if (input.imageUrl !== undefined) update.image_url = input.imageUrl;
  return update;
}
