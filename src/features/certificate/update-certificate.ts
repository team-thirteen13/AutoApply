import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  Certificate,
  CertificateOperationResult,
} from "@/types/certificate";
import {
  certificateIdSchema,
  updateCertificateSchema,
} from "@/lib/validation/certificate";
import {
  CERTIFICATE_COLUMNS,
  toCertificate,
  toCertificateUpdate,
  type CertificateRow,
} from "./certificate-map";

export async function updateCertificate(
  id: unknown,
  input: unknown,
): Promise<CertificateOperationResult<Certificate>> {
  const parsedId = certificateIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid certificate ID" },
    };
  }

  const parsedInput = updateCertificateSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid certificate data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const updateRow = toCertificateUpdate(parsedInput.data);

    const { data, error } = await supabase
      .from("certificates")
      .update(updateRow)
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .select(CERTIFICATE_COLUMNS)
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
          code: "certificate_not_found",
          message: "No certificate found for this user",
        },
      };
    }

    return { success: true, data: toCertificate(data as CertificateRow) };
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
