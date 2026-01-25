-- =============================================================================
-- PeopleHub Database Initialization Script
-- =============================================================================
-- This script is executed when the PostgreSQL container starts for the first time
-- It sets up the initial database configuration and extensions
-- =============================================================================

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Set timezone
SET timezone = 'Asia/Jakarta';

-- Create role for application (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'peoplehub') THEN
        CREATE ROLE peoplehub WITH LOGIN PASSWORD 'changeme';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE peoplehub TO peoplehub;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'PeopleHub database initialized at %', NOW();
END
$$;
