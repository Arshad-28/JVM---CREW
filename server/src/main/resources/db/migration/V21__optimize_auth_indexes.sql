-- =========================================================================
-- V21: Add Performance Indexes for User Authentication & Team Lookups
-- =========================================================================

-- 1. Index on lower(email) for fast case-insensitive user lookups
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- 2. Composite indexes on team_members for fast user and team active membership lookups
CREATE INDEX IF NOT EXISTS idx_team_members_user_active ON team_members (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_team_active ON team_members (team_id, is_active);

-- 3. Composite index on leadership_assignments for active date lookups
CREATE INDEX IF NOT EXISTS idx_leadership_team_date_status 
    ON leadership_assignments (team_id, status, start_date, end_date);
