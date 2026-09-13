-- V8: Create leadership_assignments table for monthly rotating leadership
CREATE TABLE IF NOT EXISTS leadership_assignments (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT chk_leadership_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leadership_team_dates ON leadership_assignments (team_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leadership_user ON leadership_assignments (user_id);

-- Ensure all team members have position 'SDE Intern'
UPDATE team_members SET position = 'SDE Intern';

-- Seed initial real assignment for September 2026: Mohammed Arshad (JVM-001)
INSERT INTO leadership_assignments (team_id, user_id, start_date, end_date, notes, status)
SELECT t.id, u.id, '2026-09-01', '2026-09-30', 'September 2026 Monthly Lead Rotation', 'ACTIVE'
FROM teams t, users u
WHERE u.email = 'arshadarshhh27@gmail.com'
LIMIT 1;
