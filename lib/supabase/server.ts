import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AUTH_CONFIG, type Database, DB_CONFIG, getSupabaseConfig } from "./shared";

/**
 * Creates a Supabase client for server-side operations in Next.js 15.
 * Uses the new async cookies() API from Next.js 15.
 *
 * IMPORTANT: Always create a new client per request. Never cache globally.
 * This is critical for Vercel Functions and edge runtime compatibility.
 */
export async function createClient() {
  // Next.js 15: await cookies() is now required
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    global: {
      // Ensure Next.js enhanced fetch is used (HTTP/2 + keep-alive by undici)
      fetch: (...args) => fetch(...(args as [RequestInfo, RequestInit?])),
    },
    auth: AUTH_CONFIG,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options || {});
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions. This is expected behavior in Next.js 15.
        }
      },
    },
    db: DB_CONFIG,
  });
}
