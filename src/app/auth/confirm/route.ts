import { type NextRequest, NextResponse } from "next/server";

import { routes } from "@/config/routes";
import { sanitizeAuthNextPath } from "@/features/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePublicConfigError } from "@/lib/supabase/public-config";

export const dynamic = "force-dynamic";

const supportedEmailOtpTypes = [
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery"
] as const;

type SupportedEmailOtpType = (typeof supportedEmailOtpTypes)[number];

function isSupportedEmailOtpType(value: string | null): value is SupportedEmailOtpType {
  return supportedEmailOtpTypes.includes(value as SupportedEmailOtpType);
}

function getLoginUrl(request: NextRequest, query: Record<string, string>) {
  const loginUrl = new URL(routes.admin.login, request.url);

  Object.entries(query).forEach(([key, value]) => {
    loginUrl.searchParams.set(key, value);
  });

  return loginUrl;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextPath = sanitizeAuthNextPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || !isSupportedEmailOtpType(type)) {
    return NextResponse.redirect(getLoginUrl(request, { error: "callback_failed" }));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });

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
