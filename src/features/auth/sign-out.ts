// ─────────────────────────────────────────────────────────────
// Sign-Out
// ─────────────────────────────────────────────────────────────
// Ends the current session only (scope: "local"). Does not
// revoke other sessions. Does not manipulate cookies directly.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { type AuthOperationResult } from "@/types/auth";
import { mapAuthErrorCode } from "./map-auth-error";

export async function signOut(): Promise<AuthOperationResult<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    return {
      success: false,
      error: { code: mapAuthErrorCode(error), message: error.message },
    };
  }

  return { success: true, data: undefined };
}
