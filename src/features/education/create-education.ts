import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  Education,
  EducationOperationResult,
} from "@/types/education";
import { createEducationSchema } from "@/lib/validation/education";
import {
  EDUCATION_COLUMNS,
  toEducation,
  toEducationInsert,
} from "./education-map";

export async function createEducation(
  input: unknown,
): Promise<EducationOperationResult<Education>> {
  const parsed = createEducationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid education data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const insertRow = toEducationInsert(parsed.data, user.id);

    const { data, error } = await supabase
      .from("education")
      .insert(insertRow)
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
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    return { success: true, data: toEducation(data) };
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
