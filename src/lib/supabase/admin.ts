import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/config/env-core";

export const PRODUCT_IMAGES_BUCKET = "product-images";

// Service-role client for server-side storage operations (bypasses RLS). Never expose
// this to the browser.
export function createSupabaseServiceClient() {
  const env = getServerEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase service configuration is missing.");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
