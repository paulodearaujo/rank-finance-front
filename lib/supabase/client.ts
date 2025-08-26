import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Creates a Supabase client for client-side components with Clerk authentication.
 * This client automatically includes the Clerk session token for authenticated requests.
 * Uses the official Clerk + Supabase integration pattern with accessToken.
 */
export function createClerkSupabaseClient(getToken: () => Promise<string | null>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    // Official Clerk + Supabase integration pattern
    accessToken: async () => (await getToken()) ?? null,
  });
}

/**
 * Hook-friendly version for client components
 */
export function useSupabaseClient(session: { getToken: () => Promise<string | null> } | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  if (!session) {
    // Return a client without auth for public data
    return createClient<Database>(supabaseUrl, supabaseKey);
  }

  return createClerkSupabaseClient(() => session.getToken());
}
