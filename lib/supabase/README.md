# Supabase Client Setup - Next.js 15 Best Practices

This directory contains the Supabase client configuration following the latest Next.js 15 best practices.

## Files

- **`client.ts`** - Browser client for React Client Components
- **`server.ts`** - Server client for Server Components and Route Handlers
- **`middleware.ts`** - Session update logic for Next.js middleware

## Usage Examples

### Client Components (Browser)

```tsx
"use client";

// Note: client-side Supabase is not used in this app.
// Prefer server client from `./server` when needed.

export default function ClientComponent() {
  const supabase = createClient();

  // Use supabase client as normal
  const { data } = await supabase
    .from("table")
    .select("*");
}
```

### Server Components

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function ServerComponent() {
  const supabase = await createClient();

  // Fetch data server-side
  const { data } = await supabase
    .from("table")
    .select("*");

  return <div>{/* render data */}</div>;
}
```

### Route Handlers

```tsx
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("table")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### Server Actions

```tsx
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function myAction(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("table")
    .insert({ /* data */ });

  if (!error) {
    revalidatePath("/");
  }
}
```

## Key Points

1. **Next.js 15**: Uses `await cookies()` for async cookie handling
2. **No Global Clients**: Always create new client instances per request
3. **Type Safety**: Full TypeScript support with generated database types
4. **Edge Compatible**: Works with Vercel Edge Functions and middleware
5. **Session Management**: Automatic session refresh via middleware

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Optional for database connections:

```env
DATABASE_URL=your_database_url
```

## Middleware Setup

Ensure your `middleware.ts` at the project root uses the `updateSession` function:

```tsx
// Auth middleware removed - authentication is disabled

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```
