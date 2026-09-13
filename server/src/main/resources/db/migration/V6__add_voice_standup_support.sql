-- V6__add_voice_standup_support.sql
-- Add voice standup audio storage metadata columns and flexible submission types

ALTER TABLE standups ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20) NOT NULL DEFAULT 'TEXT';
ALTER TABLE standups ADD COLUMN IF NOT EXISTS audio_file_name VARCHAR(255);
ALTER TABLE standups ADD COLUMN IF NOT EXISTS audio_storage_path VARCHAR(500);
ALTER TABLE standups ADD COLUMN IF NOT EXISTS audio_content_type VARCHAR(100);
ALTER TABLE standups ADD COLUMN IF NOT EXISTS audio_file_size BIGINT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS audio_duration_seconds INTEGER;

-- Make text columns allow empty/default for pure voice standups
ALTER TABLE standups ALTER COLUMN yesterday DROP NOT NULL;
ALTER TABLE standups ALTER COLUMN today DROP NOT NULL;
ALTER TABLE standups ALTER COLUMN learned DROP NOT NULL;
ALTER TABLE standups ALTER COLUMN confidence DROP NOT NULL;

-- Index for querying voice standups
CREATE INDEX IF NOT EXISTS idx_standups_submission_type ON standups(submission_type);

