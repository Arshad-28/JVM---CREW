-- V10__add_profile_fields_to_users_and_members.sql
-- Add comprehensive profile fields to users for realistic onboarding

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS college VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);

-- Populate profile metadata for existing real users if not already set
UPDATE users SET college = 'Kalpataru Institute of Technology, Tiptur', organization = 'Algorithms365', phone_number = '+91 9876543210' WHERE id = 1 AND college IS NULL;
UPDATE users SET college = 'Kalpataru Institute of Technology, Tiptur', organization = 'Algorithms365' WHERE id = 2 AND college IS NULL;
UPDATE users SET college = 'Kalpataru Institute of Technology, Tiptur', organization = 'Algorithms365' WHERE id = 3 AND college IS NULL;
UPDATE users SET college = 'Kalpataru Institute of Technology, Tiptur', organization = 'Algorithms365' WHERE id = 4 AND college IS NULL;
UPDATE users SET college = 'Kalpataru Institute of Technology, Tiptur', organization = 'Algorithms365' WHERE id = 5 AND college IS NULL;
