import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { EducationOperationResult } from "@/types/education";
import { educationIdSchema } from "@/lib/validation/education";

export async function deleteEducation(
  id: unknown,
): Promise<EducationOperationResult<void>> {
  const parsedId = educationIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid education ID" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("education")
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
        error: { code: "authentication_required", message: error.message },
      };
    }
    return {
      success: false,
      error: { code: "unexpected", message: "An unexpected error occurred" },
    };
  }
}
