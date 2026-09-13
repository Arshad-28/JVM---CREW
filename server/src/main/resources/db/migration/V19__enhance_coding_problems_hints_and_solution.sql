-- =========================================================================
-- V19: Enhance Coding Problems with Progressive Hints and Full Solution
-- =========================================================================

ALTER TABLE interview_coding_problems ADD COLUMN IF NOT EXISTS hints_json TEXT;
ALTER TABLE interview_coding_problems ADD COLUMN IF NOT EXISTS solution_json TEXT;
