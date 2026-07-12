import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  Project,
  ProjectOperationResult,
} from "@/types/project";
import { createProjectSchema } from "@/lib/validation/project";
import {
  PROJECT_COLUMNS,
  toProject,
  toProjectInsert,
} from "./project-map";

export async function createProject(
  input: unknown,
): Promise<ProjectOperationResult<Project>> {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid project data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const insertRow = toProjectInsert(parsed.data, user.id);

    const { data, error } = await supabase
      .from("projects")
      .insert(insertRow)
      .select(PROJECT_COLUMNS)
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

    return { success: true, data: toProject(data) };
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
