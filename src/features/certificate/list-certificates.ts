import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  Certificate,
  CertificateOperationResult,
} from "@/types/certificate";
import { CERTIFICATE_COLUMNS, toCertificate } from "./certificate-map";

export async function listCertificates(): Promise<
  CertificateOperationResult<Certificate[]>
> {
  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("certificates")
      .select(CERTIFICATE_COLUMNS)
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    const certificates = (data ?? []).map(toCertificate);
    return { success: true, data: certificates };
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
