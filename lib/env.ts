type RequiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: string;
  DATABASE_URL?: string;
  SUPABASE_DATABASE_URL?: string;
};

function readEnv(): RequiredEnv {
  // Accept both NEXT_PUBLIC_* and NEXT_* fallbacks
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    process.env.NEXT_SUPABASE_KEY;
  const databaseUrl =
    process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.NEXT_DATABASE_URL;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (or NEXT_SUPABASE_URL)");
  if (!anon)
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY (or NEXT_SUPABASE_KEY)",
    );

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: anon,
    DATABASE_URL: databaseUrl,
    SUPABASE_DATABASE_URL: databaseUrl,
  };
}

export const env = readEnv();


