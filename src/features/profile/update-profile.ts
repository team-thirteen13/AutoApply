// ─────────────────────────────────────────────────────────────
// Update Profile
// ─────────────────────────────────────────────────────────────
// Partially updates the current authenticated user's profile.
// Accepts an allowlisted patch of editable fields. Returns a
// structured result. Never throws.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import { type ProfileOperationResult, type Profile } from "@/types/profile";
import { updateProfileSchema } from "@/lib/validation/profile";
import {
  toProfile,
  toProfileUpdate,
  PROFILE_COLUMNS,
  type ProfileRow,
} from "./profile-map";

export async function updateProfile(
  input: unknown,
): Promise<ProfileOperationResult<Profile>> {
  // ── Validate input first ────────────────────────────────
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "validation_error",
        message: parsed.error.issues[0].message,
      },
    };
  }

  // ── Wrap remaining operation safely ─────────────────────
  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();
    const updateRow = toProfileUpdate(parsed.data);

    const { data, error } = await supabase
      .from("profiles")
      .update(updateRow)
      .eq("user_id", user.id)
      .select(PROFILE_COLUMNS)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: {
          code: "unexpected",
          message: "An unexpected error occurred",
        },
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
