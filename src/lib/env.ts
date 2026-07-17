import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Environment validation
// ─────────────────────────────────────────────────────────────
// Validates all required environment variables at startup using
// Zod. Fails fast with a clear error message if any variable
// is missing or malformed.
//
// Public variables (NEXT_PUBLIC_*) are available in both client
// and server bundles. Private variables are server-only.
// ─────────────────────────────────────────────────────────────

const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),

  // Application
  APP_URL: z
    .string()
    .url("APP_URL must be a valid URL")
    .default("http://localhost:3000"),

  // OAuth — comma-separated list of allowed origins for redirect validation
  // e.g. "http://localhost:3000,https://auto-apply-pied.vercel.app"
  ALLOWED_ORIGINS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid environment variables:\n${missing}\n\nCheck your .env file.`,
    );
  }

  return result.data;
}

/**
 * Validated environment variables.
 * Access typed env values via `env.NEXT_PUBLIC_SUPABASE_URL`, etc.
 *
 * Throws on first access if validation fails — no silent undefined.
 */
export const env = validateEnv();
