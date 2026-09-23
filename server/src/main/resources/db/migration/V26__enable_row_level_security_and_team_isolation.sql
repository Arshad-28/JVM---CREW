-- =========================================================================
-- V26: Enable Row Level Security (RLS) & Strict Team Isolation on all Tables
-- =========================================================================
-- Objective:
-- 1. Eliminate Supabase Security Warnings for all exposed database tables.
-- 2. ABSOLUTE DATA PRESERVATION: Zero data deletion, zero table dropping.
-- 3. Strict Team & User Data Isolation across PostgREST and Client access.
-- 4. Full uninterrupted access for Spring Boot backend (service_role, postgres).
-- =========================================================================

-- 1. Ensure Supabase auth helper functions & roles exist for portability (safe on Supabase/Render & local)
DO $$
BEGIN
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
            CREATE ROLE postgres;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
            CREATE ROLE service_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Only attempt auth schema / function creation if running on local/vanilla postgres without Supabase auth
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
            CREATE SCHEMA auth;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'auth' AND p.proname = 'uid'
        ) THEN
            EXECUTE 'CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $fn$ SELECT NULLIF(current_setting(''request.jwt.claim.sub'', true), '''')::uuid; $fn$';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- auth schema and auth.uid() are already provided and managed by Supabase; ignore permission error
        NULL;
    END;
END $$;

-- 2. Helper Security Functions (STABLE, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_auth_user_id()
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_id BIGINT;
    current_sub TEXT;
BEGIN
    BEGIN
        current_sub := NULLIF(current_setting('request.jwt.claim.sub', true), '');
    EXCEPTION WHEN OTHERS THEN
        current_sub := NULL;
    END;

    IF current_sub IS NULL THEN
        BEGIN
            SELECT id INTO found_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
            RETURN found_id;
        EXCEPTION WHEN OTHERS THEN
            RETURN NULL;
        END;
    END IF;

    -- 1. Match by Supabase auth UUID if valid UUID format
    IF current_sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        SELECT id INTO found_id FROM public.users WHERE auth_user_id = current_sub::uuid LIMIT 1;
        IF found_id IS NOT NULL THEN
            RETURN found_id;
        END IF;
    END IF;

    -- 2. Fallback matching by email if sub claim contains email address
    SELECT id INTO found_id FROM public.users WHERE email = current_sub LIMIT 1;
    RETURN found_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_team_ids()
RETURNS TABLE (team_id BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tm.team_id 
    FROM public.team_members tm
    WHERE tm.user_id = public.get_auth_user_id()
      AND tm.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_auth_user_lead(check_team_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.team_members tm
        WHERE tm.user_id = public.get_auth_user_id()
          AND tm.team_id = check_team_id
          AND tm.is_active = true
          AND UPPER(tm.role) IN ('LEAD', 'ADMIN', 'OWNER')
    );
$$;

-- =========================================================================
-- 3. Enable RLS on all 34 Application Tables
-- =========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standup_pdfs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.team_meetings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_reminders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.interview_learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_mock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_mock_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_mock_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_coding_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_user_weaknesses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. Full Operational Policies for Spring Boot Backend (postgres, service_role)
-- =========================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users', 'teams', 'team_members', 'leadership_assignments',
        'tasks', 'task_labels', 'task_history', 'task_comments',
        'standups', 'blockers', 'standup_pdfs', 'team_meetings',
        'homework', 'homework_submissions', 'homework_reminders',
        'learning_topics', 'learning_progress', 'problems', 'problem_attempts',
        'follow_ups', 'lead_messages',
        'interview_learning_sessions', 'interview_practice_questions', 'interview_practice_attempts',
        'interview_mock_sessions', 'interview_mock_questions', 'interview_mock_answers',
        'interview_coding_problems', 'interview_coding_attempts', 'interview_coach_messages',
        'interview_user_weaknesses',
        'push_subscriptions', 'notifications', 'notification_preferences'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_service_postgres_full_access" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "%s_service_postgres_full_access" ON public.%I FOR ALL TO postgres, service_role USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- =========================================================================
-- 5. User Identity & Team Membership Policies (authenticated)
-- =========================================================================

-- USERS: Authenticated users can read their teammates and own profile; update their own profile
DROP POLICY IF EXISTS "users_read_teammates_and_self" ON public.users;
CREATE POLICY "users_read_teammates_and_self" ON public.users
    FOR SELECT TO authenticated
    USING (
        auth_user_id = auth.uid() OR
        id IN (
            SELECT user_id FROM public.team_members
            WHERE team_id IN (SELECT get_auth_team_ids())
        )
    );

DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
CREATE POLICY "users_update_own_profile" ON public.users
    FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- TEAMS: Members can read their own team records
DROP POLICY IF EXISTS "teams_read_own_teams" ON public.teams;
CREATE POLICY "teams_read_own_teams" ON public.teams
    FOR SELECT TO authenticated
    USING (id IN (SELECT get_auth_team_ids()));

-- TEAM_MEMBERS: Members can read member roster of their teams
DROP POLICY IF EXISTS "team_members_read_own_team_roster" ON public.team_members;
CREATE POLICY "team_members_read_own_team_roster" ON public.team_members
    FOR SELECT TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()));

-- LEADERSHIP_ASSIGNMENTS: Visible to team members
DROP POLICY IF EXISTS "leadership_assignments_read_own_team" ON public.leadership_assignments;
CREATE POLICY "leadership_assignments_read_own_team" ON public.leadership_assignments
    FOR SELECT TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()));

-- =========================================================================
-- 6. Project & Task Policies (team isolated)
-- =========================================================================

DROP POLICY IF EXISTS "tasks_team_isolation" ON public.tasks;
CREATE POLICY "tasks_team_isolation" ON public.tasks
    FOR ALL TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()))
    WITH CHECK (team_id IN (SELECT get_auth_team_ids()));

DROP POLICY IF EXISTS "task_labels_team_isolation" ON public.task_labels;
CREATE POLICY "task_labels_team_isolation" ON public.task_labels
    FOR ALL TO authenticated
    USING (
        task_id IN (SELECT id FROM public.tasks WHERE team_id IN (SELECT get_auth_team_ids()))
    )
    WITH CHECK (
        task_id IN (SELECT id FROM public.tasks WHERE team_id IN (SELECT get_auth_team_ids()))
    );

DROP POLICY IF EXISTS "task_history_team_isolation" ON public.task_history;
CREATE POLICY "task_history_team_isolation" ON public.task_history
    FOR SELECT TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()));

DROP POLICY IF EXISTS "task_comments_team_isolation" ON public.task_comments;
CREATE POLICY "task_comments_team_isolation" ON public.task_comments
    FOR ALL TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()))
    WITH CHECK (team_id IN (SELECT get_auth_team_ids()));

-- =========================================================================
-- 7. Daily Operations (Standups, Blockers, PDFs, Meetings)
-- =========================================================================

DROP POLICY IF EXISTS "standups_team_isolation" ON public.standups;
CREATE POLICY "standups_team_isolation" ON public.standups
    FOR ALL TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()))
    WITH CHECK (team_id IN (SELECT get_auth_team_ids()));

DROP POLICY IF EXISTS "blockers_team_isolation" ON public.blockers;
CREATE POLICY "blockers_team_isolation" ON public.blockers
    FOR ALL TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()))
    WITH CHECK (team_id IN (SELECT get_auth_team_ids()));

DROP POLICY IF EXISTS "standup_pdfs_team_isolation" ON public.standup_pdfs;
CREATE POLICY "standup_pdfs_team_isolation" ON public.standup_pdfs
    FOR ALL TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()))
    WITH CHECK (team_id IN (SELECT get_auth_team_ids()));

DROP POLICY IF EXISTS "team_meetings_team_isolation" ON public.team_meetings;
CREATE POLICY "team_meetings_team_isolation" ON public.team_meetings
    FOR ALL TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()))
    WITH CHECK (team_id IN (SELECT get_auth_team_ids()));

-- =========================================================================
-- 8. Homework & Submissions (team & student scoped)
-- =========================================================================

DROP POLICY IF EXISTS "homework_team_isolation" ON public.homework;
CREATE POLICY "homework_team_isolation" ON public.homework
    FOR ALL TO authenticated
    USING (team_id IN (SELECT get_auth_team_ids()))
    WITH CHECK (team_id IN (SELECT get_auth_team_ids()));

DROP POLICY IF EXISTS "homework_submissions_access" ON public.homework_submissions;
CREATE POLICY "homework_submissions_access" ON public.homework_submissions
    FOR ALL TO authenticated
    USING (
        user_id = public.get_auth_user_id() OR
        public.is_auth_user_lead(team_id)
    )
    WITH CHECK (
        user_id = public.get_auth_user_id() OR
        public.is_auth_user_lead(team_id)
    );

DROP POLICY IF EXISTS "homework_reminders_access" ON public.homework_reminders;
CREATE POLICY "homework_reminders_access" ON public.homework_reminders
    FOR ALL TO authenticated
    USING (
        user_id = public.get_auth_user_id() OR
        reminded_by_user_id = public.get_auth_user_id()
    )
    WITH CHECK (
        reminded_by_user_id = public.get_auth_user_id()
    );

-- =========================================================================
-- 9. Learning, DSA & 1-on-1 Mentorship
-- =========================================================================

DROP POLICY IF EXISTS "learning_topics_read_catalog" ON public.learning_topics;
CREATE POLICY "learning_topics_read_catalog" ON public.learning_topics
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "learning_progress_access" ON public.learning_progress;
CREATE POLICY "learning_progress_access" ON public.learning_progress
    FOR ALL TO authenticated
    USING (
        user_id = public.get_auth_user_id() OR
        user_id IN (
            SELECT tm.user_id FROM public.team_members tm
            WHERE tm.team_id IN (SELECT get_auth_team_ids())
        )
    )
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "problems_read_catalog" ON public.problems;
CREATE POLICY "problems_read_catalog" ON public.problems
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "problem_attempts_access" ON public.problem_attempts;
CREATE POLICY "problem_attempts_access" ON public.problem_attempts
    FOR ALL TO authenticated
    USING (
        user_id = public.get_auth_user_id() OR
        user_id IN (
            SELECT tm.user_id FROM public.team_members tm
            WHERE tm.team_id IN (SELECT get_auth_team_ids())
        )
    )
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "follow_ups_access" ON public.follow_ups;
CREATE POLICY "follow_ups_access" ON public.follow_ups
    FOR ALL TO authenticated
    USING (
        member_user_id = public.get_auth_user_id() OR
        lead_user_id = public.get_auth_user_id()
    )
    WITH CHECK (
        member_user_id = public.get_auth_user_id() OR
        lead_user_id = public.get_auth_user_id()
    );

DROP POLICY IF EXISTS "lead_messages_access" ON public.lead_messages;
CREATE POLICY "lead_messages_access" ON public.lead_messages
    FOR ALL TO authenticated
    USING (
        member_user_id = public.get_auth_user_id() OR
        lead_user_id = public.get_auth_user_id()
    )
    WITH CHECK (
        member_user_id = public.get_auth_user_id() OR
        lead_user_id = public.get_auth_user_id()
    );

-- =========================================================================
-- 10. Interview Lab (User Isolated)
-- =========================================================================

DROP POLICY IF EXISTS "interview_learning_sessions_user" ON public.interview_learning_sessions;
CREATE POLICY "interview_learning_sessions_user" ON public.interview_learning_sessions
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "interview_practice_questions_user" ON public.interview_practice_questions;
CREATE POLICY "interview_practice_questions_user" ON public.interview_practice_questions
    FOR ALL TO authenticated
    USING (
        session_id IN (SELECT id FROM public.interview_learning_sessions WHERE user_id = public.get_auth_user_id())
    )
    WITH CHECK (
        session_id IN (SELECT id FROM public.interview_learning_sessions WHERE user_id = public.get_auth_user_id())
    );

DROP POLICY IF EXISTS "interview_practice_attempts_user" ON public.interview_practice_attempts;
CREATE POLICY "interview_practice_attempts_user" ON public.interview_practice_attempts
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "interview_mock_sessions_user" ON public.interview_mock_sessions;
CREATE POLICY "interview_mock_sessions_user" ON public.interview_mock_sessions
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "interview_mock_questions_user" ON public.interview_mock_questions;
CREATE POLICY "interview_mock_questions_user" ON public.interview_mock_questions
    FOR ALL TO authenticated
    USING (
        mock_session_id IN (SELECT id FROM public.interview_mock_sessions WHERE user_id = public.get_auth_user_id())
    )
    WITH CHECK (
        mock_session_id IN (SELECT id FROM public.interview_mock_sessions WHERE user_id = public.get_auth_user_id())
    );

DROP POLICY IF EXISTS "interview_mock_answers_user" ON public.interview_mock_answers;
CREATE POLICY "interview_mock_answers_user" ON public.interview_mock_answers
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "interview_coding_problems_catalog" ON public.interview_coding_problems;
CREATE POLICY "interview_coding_problems_catalog" ON public.interview_coding_problems
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "interview_coding_attempts_user" ON public.interview_coding_attempts;
CREATE POLICY "interview_coding_attempts_user" ON public.interview_coding_attempts
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "interview_coach_messages_user" ON public.interview_coach_messages;
CREATE POLICY "interview_coach_messages_user" ON public.interview_coach_messages
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "interview_user_weaknesses_user" ON public.interview_user_weaknesses;
CREATE POLICY "interview_user_weaknesses_user" ON public.interview_user_weaknesses
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

-- =========================================================================
-- 11. Communications & Notifications (User Isolated)
-- =========================================================================

DROP POLICY IF EXISTS "push_subscriptions_user" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_user" ON public.push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "notifications_user" ON public.notifications;
CREATE POLICY "notifications_user" ON public.notifications
    FOR ALL TO authenticated
    USING (recipient_user_id = public.get_auth_user_id())
    WITH CHECK (recipient_user_id = public.get_auth_user_id());

DROP POLICY IF EXISTS "notification_preferences_user" ON public.notification_preferences;
CREATE POLICY "notification_preferences_user" ON public.notification_preferences
    FOR ALL TO authenticated
    USING (user_id = public.get_auth_user_id())
    WITH CHECK (user_id = public.get_auth_user_id());

-- =========================================================================
-- 12. Storage Bucket Isolation (`jvmcrew-files`)
-- =========================================================================

DO $$
BEGIN
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'storage' AND table_name = 'buckets'
        ) THEN
            UPDATE storage.buckets
            SET public = false
            WHERE id = 'jvmcrew-files';
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'storage' AND table_name = 'objects'
        ) THEN
            EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
            
            EXECUTE 'DROP POLICY IF EXISTS "jvmcrew_files_service_role_all" ON storage.objects';
            EXECUTE 'CREATE POLICY "jvmcrew_files_service_role_all" ON storage.objects FOR ALL TO postgres, service_role USING (true) WITH CHECK (true)';
            
            EXECUTE 'DROP POLICY IF EXISTS "jvmcrew_files_authenticated_read" ON storage.objects';
            EXECUTE 'CREATE POLICY "jvmcrew_files_authenticated_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''jvmcrew-files'')';
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
