import { createBrowserClient } from "@supabase/ssr";
import { AUTH_CONFIG, type Database, DB_CONFIG, getSupabaseConfig } from "./shared";

/**
 * Creates a Supabase client for browser/client-side operations.
 * This client is safe to use in React Client Components.
 *
 * Uses the public environment variables which are exposed to the browser.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseConfig();

  return createBrowserClient<Database>(url, anonKey, {
    auth: AUTH_CONFIG,
    db: DB_CONFIG,
  });
}
