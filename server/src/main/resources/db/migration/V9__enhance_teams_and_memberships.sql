-- V9: Enhance teams and team_members for dynamic multi-team production management
ALTER TABLE teams ADD COLUMN IF NOT EXISTS custom_name VARCHAR(100);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS cohort VARCHAR(100) DEFAULT 'Internship Cohort 2026';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS left_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Set custom_name and standardized display name for existing teams
UPDATE teams
SET custom_name = 'Alpha',
    name = 'JVM CREW Alpha',
    cohort = 'Internship Cohort 2026',
    is_active = TRUE,
    updated_at = NOW()
WHERE id = 1 OR custom_name IS NULL;

-- Ensure all team members have position 'SDE Intern'
UPDATE team_members SET position = 'SDE Intern' WHERE position IS NULL OR position != 'SDE Intern';
