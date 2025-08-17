import type { Database } from "@/lib/apps-scrape.types";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Validates and returns Supabase configuration
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return { url, anonKey };
}

/**
 * Shared auth configuration for all Supabase clients
 */
export const AUTH_CONFIG = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

/**
 * Database schema configuration
 */
export const DB_CONFIG = {
  schema: "apps",
} as const;

export type { Database };
