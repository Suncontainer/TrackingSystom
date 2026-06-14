import { z } from "zod";

const optionalString = z.string().trim().optional();
const requiredInProduction = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_MAIN_SITE_URL",
  "TRACKING_LINK_SECRET",
  "CRON_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "DATABASE_URL",
  "DATABASE_DIRECT_URL",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY"
] as const;

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    DEMO_MODE: z.enum(["true", "false"]).default("false"),
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_MAIN_SITE_URL: z.url().default("https://suncontainer.de"),
    APP_DEFAULT_LOCALE: z.enum(["de", "en"]).default("de"),
    TRACKING_LINK_SECRET: optionalString,
    CRON_SECRET: optionalString,
    NEXT_PUBLIC_SUPABASE_URL: optionalString,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
    SUPABASE_SECRET_KEY: optionalString,
    DATABASE_URL: optionalString,
    DATABASE_DIRECT_URL: optionalString,
    RESEND_API_KEY: optionalString,
    RESEND_WEBHOOK_SECRET: optionalString,
    EMAIL_FROM: z.string().trim().default("Sun Container <tracking@updates.suncontainer.de>"),
    EMAIL_REPLY_TO: z.email().default("info@suncontainer.de"),
    EMAIL_MODE: z.enum(["log", "sandbox", "production"]).default("log"),
    EMAIL_RECIPIENT_ALLOWLIST: optionalString,
    UPSTASH_REDIS_REST_URL: optionalString,
    UPSTASH_REDIS_REST_TOKEN: optionalString,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
    TURNSTILE_SECRET_KEY: optionalString,
    SENTRY_DSN: optionalString,
    SENTRY_AUTH_TOKEN: optionalString
  })
  .superRefine((env, ctx) => {
    if (env.VERCEL_ENV !== "production" || env.DEMO_MODE === "true") {
      return;
    }

    for (const key of requiredInProduction) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required in production`
        });
      }
    }

    if (env.EMAIL_MODE === "production" && env.NODE_ENV !== "production") {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_MODE"],
        message: "EMAIL_MODE=production is only allowed when NODE_ENV=production"
      });
    }
  });

export function getServerEnv() {
  return envSchema.parse(process.env);
}

export type ServerEnv = z.infer<typeof envSchema>;
