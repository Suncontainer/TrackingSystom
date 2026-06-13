export type SupabasePublicConfig = {
  publishableKey: string;
  url: string;
};

type SupabasePublicEnv = {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL?: string | undefined;
};

export class SupabasePublicConfigError extends Error {
  constructor() {
    super("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required for Supabase Auth.");
    this.name = "SupabasePublicConfigError";
  }
}

function getDefaultSupabasePublicEnv(): SupabasePublicEnv {
  return {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
  };
}

export function getSupabasePublicConfig(env: SupabasePublicEnv = getDefaultSupabasePublicEnv()) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return {
    publishableKey,
    url
  } satisfies SupabasePublicConfig;
}

export function requireSupabasePublicConfig(env?: SupabasePublicEnv) {
  const config = getSupabasePublicConfig(env);

  if (!config) {
    throw new SupabasePublicConfigError();
  }

  return config;
}
