-- V14__expand_and_verify_social_profile_urls.sql
-- Ensure linkedin_url and github_url columns exist on users with ample capacity

ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);

