import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { routes } from "@/config/routes";
import { sanitizeAuthNextPath } from "@/features/auth/redirects";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("auth redirect safety", () => {
  it("keeps auth next redirects relative to this application", () => {
    expect(sanitizeAuthNextPath("/admin/orders")).toBe("/admin/orders");
    expect(sanitizeAuthNextPath("https://evil.example/admin")).toBe(routes.admin.home);
    expect(sanitizeAuthNextPath("//evil.example/admin")).toBe(routes.admin.home);
    expect(sanitizeAuthNextPath(null)).toBe(routes.admin.home);
  });
});

describe("supabase public configuration", () => {
  it("requires both public Supabase values", () => {
    expect(getSupabasePublicConfig({})).toBeNull();
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable"
      })
    ).toBeNull();
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co"
      })
    ).toEqual({
      publishableKey: "publishable",
      url: "https://example.supabase.co"
    });
  });

  it("keeps server secrets out of browser-safe Supabase modules", () => {
    const browserSource = readSource("src/lib/supabase/browser.ts");
    const publicConfigSource = readSource("src/lib/supabase/public-config.ts");
    const browserBundleSources = `${browserSource}\n${publicConfigSource}`;

    expect(browserBundleSources).not.toMatch(/SUPABASE_SECRET_KEY/);
    expect(browserBundleSources).not.toMatch(/DATABASE_URL/);
    expect(browserBundleSources).not.toMatch(/DATABASE_DIRECT_URL/);
    expect(browserBundleSources).not.toMatch(/server-only/);
  });

  it("keeps admin routes behind the server guard", () => {
    const adminLayoutSource = readSource("src/app/(admin)/admin/layout.tsx");

    expect(adminLayoutSource).toContain("requireAdminProfileOrRedirect");
    expect(readSource("src/lib/supabase/server.ts")).toContain('import "server-only"');
    expect(readSource("src/features/auth/guards.ts")).toContain('import "server-only"');
  });
});
