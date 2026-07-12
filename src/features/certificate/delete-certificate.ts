import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { CertificateOperationResult } from "@/types/certificate";
import { certificateIdSchema } from "@/lib/validation/certificate";

export async function deleteCertificate(
  id: unknown,
): Promise<CertificateOperationResult<void>> {
  const parsedId = certificateIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid certificate ID" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq("id", parsedId.data)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        error: {
          code: "authentication_required",
          message: error.message,
        },
      };
    }
    return {
      success: false,
      error: { code: "unexpected", message: "An unexpected error occurred" },
    };
  }
}
