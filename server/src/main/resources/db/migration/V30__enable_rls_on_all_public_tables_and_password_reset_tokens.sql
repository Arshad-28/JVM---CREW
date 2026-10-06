-- =========================================================================
-- V30: Enable Row Level Security (RLS) on password_reset_tokens & all public tables
-- =========================================================================
-- Objective:
-- 1. Fix Supabase Security Advisor critical alert: rls_disabled_in_public.
-- 2. Enable RLS on password_reset_tokens and restrict direct anon/authenticated PostgREST access.
-- 3. Ensure full backend access for Spring Boot (postgres, service_role).
-- 4. Dynamically enforce RLS on all existing public application tables.
-- =========================================================================

-- 1. Secure password_reset_tokens
ALTER TABLE IF EXISTS public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Revoke public PostgREST API access from anon and authenticated roles
REVOKE ALL ON TABLE public.password_reset_tokens FROM anon;
REVOKE ALL ON TABLE public.password_reset_tokens FROM authenticated;

-- Ensure backend (service_role, postgres) has unrestricted access
DROP POLICY IF EXISTS "password_reset_tokens_service_postgres_full_access" ON public.password_reset_tokens;
CREATE POLICY "password_reset_tokens_service_postgres_full_access" 
ON public.password_reset_tokens 
FOR ALL TO postgres, service_role 
USING (true) 
WITH CHECK (true);

-- 2. Automatically enable RLS on ANY other application table in the public schema missing RLS
-- (Excluding flyway_schema_history to prevent self-locking during active Flyway migration transactions)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND rowsecurity = false
          AND tablename != 'flyway_schema_history'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
        
        -- Revoke public anon access on any newly secured table
        BEGIN
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', r.tablename);
        EXCEPTION WHEN OTHERS THEN 
            NULL;
        END;
        
        -- Grant full access to backend roles
        EXECUTE format('DROP POLICY IF EXISTS "%s_service_postgres_full_access" ON public.%I;', r.tablename, r.tablename);
        EXECUTE format('CREATE POLICY "%s_service_postgres_full_access" ON public.%I FOR ALL TO postgres, service_role USING (true) WITH CHECK (true);', r.tablename, r.tablename);
    END LOOP;
END $$;
