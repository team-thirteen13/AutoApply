// ─────────────────────────────────────────────────────────────
// Get Profile
// ─────────────────────────────────────────────────────────────
// Retrieves the current authenticated user's profile.
// Returns a structured result. Never throws.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import { type ProfileOperationResult, type Profile } from "@/types/profile";
import {
  toProfile,
  PROFILE_COLUMNS,
  type ProfileRow,
} from "./profile-map";

export async function getProfile(): Promise<ProfileOperationResult<Profile>> {
  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    if (!data) {
      return {
        success: false,
        error: {
          code: "profile_not_found",
          message: "No profile found for this user",
        },
      };
    }

    return { success: true, data: toProfile(data as ProfileRow) };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        error: { code: "authentication_required", message: error.message },
      };
    }
    return {
      success: false,
      error: { code: "unexpected", message: "An unexpected error occurred" },
    };
  }
}
