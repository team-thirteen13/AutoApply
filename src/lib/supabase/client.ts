import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseKey } from "./env";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function createClient() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getSupabaseKey();

  return createBrowserClient(supabaseUrl, supabaseKey);
}
