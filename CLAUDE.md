# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js dashboard application with App Router, SSR authentication, Tailwind CSS v4, shadcn/ui components, and Supabase integration. Built for creating metrics dashboards with consistent theming and component library.

## Development Commands

```bash
# Install dependencies (ALWAYS use pnpm)
pnpm install

# Start development server
pnpm dev                      # http://localhost:3000

# Code quality
pnpm lint                     # Biome check and auto-fix
pnpm format                   # Biome format
pnpm typecheck                # TypeScript validation

# Database operations
pnpm db:reset:local           # Reset local DB and apply migrations
pnpm db:types:local           # Generate types from local DB
pnpm db:sync-types:local      # Reset + generate types in one step

# Production build
pnpm build && pnpm start
```

## Architecture & Critical Files

### Authentication Flow
- **middleware.ts**: Validates/refreshes Supabase session on every request via `updateSession()`
- **lib/supabase/middleware.ts**: Session management with `getClaims()` to prevent random logouts
- **lib/supabase/client.ts & server.ts**: Separate clients for browser/server environments

### Tailwind CSS v4 Configuration
- **app/globals.css**: Uses single `@import "tailwindcss"` (v4 syntax)
- **postcss.config.mjs**: Must use `@tailwindcss/postcss` plugin
- **No tailwind.config.ts**: v4 uses CSS-based configuration via `@theme inline`

### Component Architecture
- **components/ui/**: shadcn/ui components with `data-slot` attributes
- **lib/utils.ts**: `cn()` helper combining `clsx` + `tailwind-merge`
- **components/app-sidebar.tsx**: Main navigation component
- **app/dashboard/page.tsx**: Dashboard layout with SidebarProvider

## UI/UX Guidelines (from .cursor/rules/ux.mdc)

- Follow shadcn/ui patterns in `components/ui/`
- Maintain WCAG 2.1 AA contrast standards
- Use OKLCH color system with CSS variables
- Components expose `data-slot` for selective styling
- Mobile-first responsive design with min 44x44px touch targets

## Code Quality Standards

### Biome Configuration
- 2-space indentation, 100 char line width
- Double quotes for strings
- Auto-organize imports on save
- Disabled linting for `components/ui/**` (shadcn components)

### TypeScript
- Strict mode enabled across all tsconfig files
- Generate DB types before using Supabase queries
- Use type hints for complex helpers

## Supabase Integration

### Local Development
```bash
# Start Supabase stack (uses Podman)
podman machine start
npx -y supabase start

# Environment variables required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Database Migrations
- Located in `supabase/migrations/`
- Applied automatically on `pnpm db:reset:local`
- Types regenerated with `pnpm db:types:local`

## Theme System

### Color Tokens (OKLCH)
- Light/dark mode CSS variables in `app/globals.css`
- Sidebar-specific colors for navigation
- Chart colors (1-5) for data visualization
- Applied via Tailwind utilities: `bg-background`, `text-foreground`, etc.

### Component Styling
```tsx
// Use cn() for conditional classes
import { cn } from "@/lib/utils"
className={cn("base-classes", condition && "conditional-class")}
```

## Critical Dependencies

- **Next.js**: Latest with App Router
- **React**: v19.0.0
- **Tailwind CSS**: v4.1.11 with @tailwindcss/postcss
- **Supabase**: @supabase/ssr + @supabase/supabase-js (latest)
- **shadcn/ui**: Via Radix UI primitives
- **Recharts**: v2.15.4 for charts
- **Biome**: Code formatting/linting

## Common Pitfalls to Avoid

1. **Never create tailwind.config.ts** - v4 doesn't use config files
2. **Always use pnpm** - Project uses pnpm@10.14.0 as package manager
3. **Session management** - Must call `getClaims()` in middleware to prevent logouts
4. **CSS imports** - Use single `@import "tailwindcss"` not separate module imports
5. **Podman not Docker** - Use podman commands for containers

## Project Structure

```
app/
├── dashboard/          # Dashboard pages
│   ├── page.tsx       # Main dashboard with sidebar
│   └── data.json      # Sample data
├── globals.css        # Tailwind v4 imports + theme tokens
└── layout.tsx         # Root layout

components/
├── ui/                # shadcn/ui components
├── app-sidebar.tsx    # Navigation sidebar
├── chart-*.tsx        # Chart components
└── data-table.tsx     # Data display

lib/
├── supabase/          # Auth clients and middleware
├── database.types.ts  # Generated DB types
└── utils.ts           # cn() helper

supabase/
├── migrations/        # SQL migration files
└── config.toml        # Local dev configuration
```