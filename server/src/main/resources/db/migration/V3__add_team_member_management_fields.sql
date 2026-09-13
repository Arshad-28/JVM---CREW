-- V3__add_team_member_management_fields.sql
-- Add serial_number and position to team_members

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS serial_number VARCHAR(50);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS position VARCHAR(100);

-- Populate initial serial numbers and positions for existing seeded records
UPDATE team_members SET serial_number = 'JVM-001', position = 'Team Lead / Captain' WHERE user_id = 1 AND serial_number IS NULL;
UPDATE team_members SET serial_number = 'JVM-002', position = 'Full Stack Engineer' WHERE user_id = 2 AND serial_number IS NULL;
UPDATE team_members SET serial_number = 'JVM-003', position = 'Backend Engineer' WHERE user_id = 3 AND serial_number IS NULL;
UPDATE team_members SET serial_number = 'JVM-004', position = 'System Engineer' WHERE user_id = 4 AND serial_number IS NULL;
UPDATE team_members SET serial_number = 'JVM-005', position = 'Data Engineer' WHERE user_id = 5 AND serial_number IS NULL;