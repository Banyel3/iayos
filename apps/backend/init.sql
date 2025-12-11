-- iAyos Database Initialization Script
-- This file is executed when the local PostgreSQL container starts for the first time
-- It creates the necessary extensions that Django expects

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'iAyos local database initialized successfully';
    RAISE NOTICE 'Database: iayos_db';
    RAISE NOTICE 'User: iayos_user';
    RAISE NOTICE 'Ready for Django migrations';
END $$;
