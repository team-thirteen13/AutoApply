import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  Project,
  ProjectOperationResult,
} from "@/types/project";
import { projectIdSchema } from "@/lib/validation/project";
import {
  PROJECT_COLUMNS,
  toProject,
  type ProjectRow,
} from "./project-map";

export async function getProject(
  id: unknown,
): Promise<ProjectOperationResult<Project>> {
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid project ID" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", parsedId.data)
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
          code: "project_not_found",
          message: "No project found for this user",
        },
      };
    }

    return { success: true, data: toProject(data as ProjectRow) };
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
