-- V24: Create Team Meetings table for external meeting integration
CREATE TABLE IF NOT EXISTS team_meetings (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'GOOGLE_MEET',
    meeting_url VARCHAR(1024) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_meetings_team_active ON team_meetings(team_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_meetings_team_date ON team_meetings(team_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_team_meetings_created_by ON team_meetings(created_by);
