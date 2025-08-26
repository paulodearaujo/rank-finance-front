# Deployment Guide - Render

## Required Environment Variables

The following environment variables **MUST** be configured in Render for successful deployment:

### 🔐 Authentication (Clerk)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_HERE
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/
```

### 🗄️ Database (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

## How to Configure in Render

1. Go to your Render Dashboard
2. Select your service
3. Go to **Environment** tab
4. Add each variable listed above with your actual values
5. **Important**: Get your Clerk keys from https://dashboard.clerk.com/last-active?path=api-keys
6. Get your Supabase keys from your Supabase project settings

## Build Settings (render.yaml)

Already configured in `render.yaml`:
- **Build Command**: `pnpm install --frozen-lockfile && pnpm run build`
- **Start Command**: `pnpm start`
- **Node Version**: 22

## Common Issues

### Error: Missing publishableKey
**Solution**: Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Render environment variables.

### Error: Supabase connection failed
**Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.

## Testing Locally

Before deploying, test with production build:
```bash
pnpm build
pnpm start
```

Make sure `.env.local` contains all required variables for local testing.
