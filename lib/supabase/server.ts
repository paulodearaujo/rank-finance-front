import type { Database } from "@/lib/apps-scrape.types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient<Database>(url, anon, {
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
    db: {
      schema: "apps",
    },
  });
}
