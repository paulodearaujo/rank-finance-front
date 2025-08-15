import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/apps-scrape.types";

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
    console.warn("Supabase environment variables missing in middleware");
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
  });

  // CRITICAL: Do not add any logic between createServerClient and getUser().
  // This could cause hard-to-debug issues with session management.

  // Use getUser() instead of getClaims() for better compatibility
  // This validates the JWT and refreshes the session if needed
  await supabase.auth.getUser();

  // Optional: Add route protection logic here
  // Example:
  // if (!user && request.nextUrl.pathname.startsWith('/protected')) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/login';
  //   return NextResponse.redirect(url);
  // }

  // IMPORTANT: Always return the supabaseResponse object as-is.
  // If you need to modify it:
  // 1. Pass the request: NextResponse.next({ request })
  // 2. Copy cookies: newResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Make your changes (but don't touch cookies!)
  // 4. Return the modified response

  return supabaseResponse;
}
