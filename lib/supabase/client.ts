import type { Database } from "@/lib/apps-scrape.types";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser/client-side operations.
 * This client is safe to use in React Client Components.
 *
 * Uses the public environment variables which are exposed to the browser.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing Supabase public environment variables");
  }

  return createBrowserClient<Database>(url, anon, {
    db: {
      schema: "apps",
    },
  });
}
