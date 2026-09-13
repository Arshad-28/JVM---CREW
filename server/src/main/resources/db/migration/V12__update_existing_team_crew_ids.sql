-- Migration V12: Standardize existing team name and update crew IDs to team-specific format (ALPHA-001..ALPHA-005)

-- 1. Standardize Team 1 name to 'Alpha'
UPDATE teams SET name = 'Alpha', custom_name = 'Alpha' WHERE id = 1;

-- 2. Update Team 1 members' serial_number to ALPHA-001 .. ALPHA-005
UPDATE team_members SET serial_number = 'ALPHA-001' WHERE team_id = 1 AND user_id = 1;
UPDATE team_members SET serial_number = 'ALPHA-002' WHERE team_id = 1 AND user_id = 2;
UPDATE team_members SET serial_number = 'ALPHA-003' WHERE team_id = 1 AND user_id = 3;
UPDATE team_members SET serial_number = 'ALPHA-004' WHERE team_id = 1 AND user_id = 4;
UPDATE team_members SET serial_number = 'ALPHA-005' WHERE team_id = 1 AND user_id = 5;

-- 3. Add unique constraint on (team_id, serial_number) to enforce no duplicate crew IDs within any team
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_team_members_team_serial'
    ) THEN
        ALTER TABLE team_members ADD CONSTRAINT uk_team_members_team_serial UNIQUE (team_id, serial_number);
    END IF;
END $$;
