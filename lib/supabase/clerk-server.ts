import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Creates a Supabase client for server components with Clerk authentication.
 * This uses Clerk's server-side auth to get the session token.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const supabase = await createServerSupabaseClient();
 * const { data } = await supabase.from('tasks').select();
 * ```
 */
export async function createServerSupabaseClient() {
  const { getToken } = await auth();

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
 * Creates a Supabase client for server actions with Clerk authentication.
 * Similar to createServerSupabaseClient but optimized for server actions.
 */
export async function createActionSupabaseClient() {
  return createServerSupabaseClient();
}
