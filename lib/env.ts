/**
 * Environment variable validation and typing for Supabase configuration.
 * This ensures all required environment variables are present at runtime.
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  DATABASE_URL: string | undefined;
}

/**
 * Validates and returns environment variables with proper typing.
 * Throws descriptive errors if required variables are missing.
 */
function validateEnv(): EnvConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  // Validate required variables
  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env.local file or deployment environment variables.",
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: url as string,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey as string,
    DATABASE_URL: databaseUrl,
  };
}

// Export validated environment variables
export const env = validateEnv();
