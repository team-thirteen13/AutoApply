import { z } from "zod";
import { isoDateSchema } from "./experience";

// ── ID validation ─────────────────────────────────────────

export const certificateIdSchema = z.string().uuid("Invalid certificate ID");

export type CertificateIdInput = z.infer<typeof certificateIdSchema>;

// ── Create input validation ───────────────────────────────

export const createCertificateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    url: z.string().trim().min(1, "URL is required").max(500),
    startDate: isoDateSchema,
    endDate: isoDateSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.endDate == null) return true;
      return data.endDate >= data.startDate;
    },
    { message: "End date must be on or after start date", path: ["endDate"] },
  );

export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;

// ── Update input validation ───────────────────────────────

export const updateCertificateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200).optional(),
    url: z.string().trim().min(1, "URL is required").max(500).optional(),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" },
  );

export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;
