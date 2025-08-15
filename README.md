# Next.js 15 + Supabase Template 2025

A production-ready Next.js 15 template with Supabase integration, TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Features

- **Next.js 15** with App Router and Server Components
- **Supabase** integration with SSR support
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **shadcn/ui** components library
- **Biome** for fast linting and formatting
- **pnpm** for efficient package management
- **Environment validation** with runtime checks
- **Database types** auto-generated from Supabase

## 📋 Prerequisites

- Node.js 20+
- pnpm 10.14.0+
- Supabase account (for production)

## 🛠️ Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-project-name>

# Install dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# Get these from: https://supabase.com/dashboard/project/_/settings/api
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

### 3. Supabase Setup (Optional)

```bash
# Login to Supabase CLI
npx supabase login

# Link to your Supabase project
pnpm db:link

# Pull remote schema (if using existing project)
pnpm db:pull

# Generate TypeScript types
pnpm db:types:linked
```

### 4. Development

```bash
# Start the development server
pnpm dev

# Open http://localhost:3000
```

## 📦 Available Scripts

```bash
pnpm dev              # Start development server with Turbo
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run Biome linter
pnpm format           # Format code with Biome
pnpm typecheck        # Check TypeScript types

# Database scripts
pnpm db:link          # Link to Supabase project
pnpm db:pull          # Pull migrations from remote
pnpm db:types:linked  # Generate types from linked project
pnpm db:types:local   # Generate types from local DB
pnpm db:reset:local   # Reset local database
```

## 📁 Project Structure

```
.
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── supabase/          # Supabase clients
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── middleware.ts  # Session refresh logic
│   ├── database.types.ts  # Generated DB types
│   ├── env.ts             # Environment validation
│   └── utils.ts           # Utility functions
├── supabase/
│   ├── config.toml        # Supabase config
│   └── migrations/        # Database migrations
├── middleware.ts          # Next.js middleware
└── package.json           # Dependencies & scripts
```

## 🔐 Authentication Setup

The template includes Supabase authentication setup for:

- Server Components (`lib/supabase/server.ts`)
- Client Components (`lib/supabase/client.ts`)
- Middleware session refresh (`middleware.ts`)

### Server Component Example

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <div>Hello {user?.email}</div>
}
```

### Client Component Example

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function Component() {
  const supabase = createClient()
  // Use supabase client
}
```

## 🎨 UI Components

This template uses [shadcn/ui](https://ui.shadcn.com/) components. Add new components with:

```bash
npx shadcn@latest add button
```

## 🧪 Type Safety

TypeScript types for your database are auto-generated:

```typescript
import type { Database } from '@/lib/database.types'

// Types are available for all tables
type User = Database['public']['Tables']['users']['Row']
```

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Click the deploy button
2. Add environment variables
3. Deploy

### Environment Variables for Production

Ensure these are set in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🛡️ Security

- Environment variables are validated at runtime
- Supabase Row Level Security (RLS) should be enabled
- API keys are public (anon key) - use RLS for security
- Never commit `.env` files

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📝 License

MIT

---

Built with ❤️ using Next.js 15 and Supabase
