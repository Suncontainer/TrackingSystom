import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabasePublicConfig } from "./public-config";

export async function createSupabaseServerClient() {
  const config = requireSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. The proxy refresh path handles that case.
        }
      }
    }
  });
}
