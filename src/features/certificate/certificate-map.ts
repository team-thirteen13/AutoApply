import type { Certificate } from "@/types/certificate";
import type {
  CreateCertificateInput,
  UpdateCertificateInput,
} from "@/lib/validation/certificate";

// ── Database row ──────────────────────────────────────────

export type CertificateRow = {
  id: string;
  user_id: string;
  name: string;
  url: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

// ── Explicit column selection ──────────────────────────────

export const CERTIFICATE_COLUMNS =
  "id, user_id, name, url, start_date, end_date, created_at, updated_at";

// ── Row → domain ──────────────────────────────────────────

export function toCertificate(row: CertificateRow): Certificate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    url: row.url,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Domain → insert row ───────────────────────────────────

export type CertificateInsertRow = {
  user_id: string;
  name: string;
  url: string;
  start_date: string;
  end_date?: string | null;
};

export function toCertificateInsert(
  input: CreateCertificateInput,
  userId: string,
): CertificateInsertRow {
  return {
    user_id: userId,
    name: input.name,
    url: input.url,
    start_date: input.startDate,
    ...(input.endDate !== undefined && { end_date: input.endDate }),
  };
}

// ── Domain → update row ───────────────────────────────────

export type CertificateUpdateRow = {
  name?: string;
  url?: string;
  start_date?: string;
  end_date?: string | null;
};

export function toCertificateUpdate(
  input: UpdateCertificateInput,
): CertificateUpdateRow {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.url !== undefined && { url: input.url }),
    ...(input.startDate !== undefined && { start_date: input.startDate }),
    ...(input.endDate !== undefined && { end_date: input.endDate }),
  };
}
