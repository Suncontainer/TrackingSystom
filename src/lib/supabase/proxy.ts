import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicConfig } from "./public-config";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabasePublicConfig();

  if (!config) {
    return response;
  }

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}
