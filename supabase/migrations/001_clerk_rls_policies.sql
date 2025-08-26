-- ==============================================================================
-- Clerk + Supabase Third-Party Auth RLS Policies
-- ==============================================================================
-- These policies use auth.jwt() to access Clerk user claims
-- The 'sub' claim contains the Clerk user_id
-- ==============================================================================

-- Create a user_profiles table (optional - for storing user metadata)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,  -- Clerk user ID from JWT 'sub'
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id);

-- Policy: Users can update only their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Policy: Users can insert their own profile on first sign-in
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- ==============================================================================
-- Example: Protected app_favorites table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  store TEXT NOT NULL CHECK (store IN ('apple', 'google')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, app_id, store)
);

-- Enable RLS
ALTER TABLE public.app_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own favorites
CREATE POLICY "Users can view own favorites" ON public.app_favorites
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id);

-- Policy: Users can only add favorites for themselves
CREATE POLICY "Users can insert own favorites" ON public.app_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Policy: Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites" ON public.app_favorites
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id);

-- ==============================================================================
-- Example: Check organization membership (if using Clerk Organizations)
-- ==============================================================================
-- The JWT contains 'org_id' and 'org_role' claims when user is in an org

-- Example table for org-scoped data
CREATE TABLE IF NOT EXISTS public.org_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.org_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Only members of the org can view projects
CREATE POLICY "Org members can view projects" ON public.org_projects
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'org_id') = org_id);

-- Policy: Only org admins can create projects
CREATE POLICY "Org admins can create projects" ON public.org_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'org_id') = org_id 
    AND (auth.jwt() ->> 'org_role') = 'org:admin'
  );

-- ==============================================================================
-- Helper function to get current user ID from Clerk JWT
-- ==============================================================================
CREATE OR REPLACE FUNCTION auth.clerk_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'sub';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage in a policy:
-- USING (auth.clerk_user_id() = user_id)
