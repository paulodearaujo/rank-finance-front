import type { Database } from "@/lib/apps-scrape.types";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Updates the user session in Next.js middleware.
 * This function MUST be called from middleware.ts to keep auth tokens fresh.
 *
 * @param request - The incoming request
 * @returns NextResponse with updated session cookies
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
        // Update cookies in the request
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Create new response with updated cookies
        supabaseResponse = NextResponse.next({
          request,
        });

        // Set cookies in the response
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options || {});
        });
      },
    },
    db: {
      schema: "apps",
    },
  });

  // Use getUser() to validate and refresh session if needed
  await supabase.auth.getUser();

  return supabaseResponse;
}
