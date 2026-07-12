import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  Education,
  EducationOperationResult,
} from "@/types/education";
import { EDUCATION_COLUMNS, toEducation } from "./education-map";

export async function listEducations(): Promise<
  EducationOperationResult<Education[]>
> {
  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("education")
      .select(EDUCATION_COLUMNS)
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    const educations = (data ?? []).map(toEducation);
    return { success: true, data: educations };
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
