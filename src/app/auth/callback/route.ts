import { type NextRequest, NextResponse } from "next/server";

import { routes } from "@/config/routes";
import { sanitizeAuthNextPath } from "@/features/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePublicConfigError } from "@/lib/supabase/public-config";

export const dynamic = "force-dynamic";

function getLoginUrl(request: NextRequest, query: Record<string, string>) {
  const loginUrl = new URL(routes.admin.login, request.url);

  Object.entries(query).forEach(([key, value]) => {
    loginUrl.searchParams.set(key, value);
  });

  return loginUrl;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeAuthNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(getLoginUrl(request, { error: "callback_failed" }));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  } catch (error) {
    if (error instanceof SupabasePublicConfigError) {
      return NextResponse.redirect(getLoginUrl(request, { error: "auth_unconfigured" }));
    }

    throw error;
  }

  return NextResponse.redirect(getLoginUrl(request, { error: "callback_failed" }));
}
