-- Create a dedicated schema for apps-related tables
-- This schema is used to isolate type generation for specific tables
CREATE SCHEMA IF NOT EXISTS apps;

-- Grant permissions for the schema
GRANT USAGE ON SCHEMA apps TO anon,
authenticated,
service_role;

-- Create a view in the apps schema that references the apps_scrape table in public schema
-- This way we don't need to actually move the table, just create a reference
CREATE
OR REPLACE VIEW apps.apps_scrape AS
SELECT
  *
FROM
  public.apps_scrape;

-- Grant permissions on the view
GRANT
SELECT
  ON apps.apps_scrape TO anon,
  authenticated,
  service_role;

-- Set default privileges for future objects in the schema
ALTER DEFAULT PRIVILEGES IN SCHEMA apps GRANT
SELECT
  ON TABLES TO anon,
  authenticated,
  service_role;

-- Add comments to document the purpose
COMMENT ON SCHEMA apps IS 'Schema for app-related data, used to isolate type generation';

COMMENT ON VIEW apps.apps_scrape IS 'View referencing public.apps_scrape for type generation isolation';
