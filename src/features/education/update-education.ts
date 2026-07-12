import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  Education,
  EducationOperationResult,
} from "@/types/education";
import {
  educationIdSchema,
  updateEducationSchema,
} from "@/lib/validation/education";
import {
  EDUCATION_COLUMNS,
  toEducation,
  toEducationUpdate,
  type EducationRow,
} from "./education-map";

export async function updateEducation(
  id: unknown,
  input: unknown,
): Promise<EducationOperationResult<Education>> {
  const parsedId = educationIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid education ID" },
    };
  }

  const parsedInput = updateEducationSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid education data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const updateRow = toEducationUpdate(parsedInput.data);

    const { data, error } = await supabase
      .from("education")
      .update(updateRow)
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .select(EDUCATION_COLUMNS)
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
          code: "education_not_found",
          message: "No education found for this user",
        },
      };
    }

    return { success: true, data: toEducation(data as EducationRow) };
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
