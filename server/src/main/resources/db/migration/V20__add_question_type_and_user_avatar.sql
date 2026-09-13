-- =========================================================================
-- V20: Add Question Type to Coding Problems and Avatar Support to Users
-- =========================================================================

ALTER TABLE interview_coding_problems ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'PROGRAM';
ALTER TABLE interview_coding_problems ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'JAVA';

ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
