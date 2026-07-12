import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  Certificate,
  CertificateOperationResult,
} from "@/types/certificate";
import { createCertificateSchema } from "@/lib/validation/certificate";
import {
  CERTIFICATE_COLUMNS,
  toCertificate,
  toCertificateInsert,
} from "./certificate-map";

export async function createCertificate(
  input: unknown,
): Promise<CertificateOperationResult<Certificate>> {
  const parsed = createCertificateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid certificate data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const insertRow = toCertificateInsert(parsed.data, user.id);

    const { data, error } = await supabase
      .from("certificates")
      .insert(insertRow)
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
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    return { success: true, data: toCertificate(data) };
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
