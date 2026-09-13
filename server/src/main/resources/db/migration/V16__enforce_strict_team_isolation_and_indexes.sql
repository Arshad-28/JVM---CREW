-- =========================================================================
-- V16: Enforce Strict Team Data Isolation, Foreign Keys, and Team Indexes
-- =========================================================================

-- 1. Ensure task_comments has team_id with Foreign Key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_comments' AND column_name = 'team_id'
    ) THEN
        ALTER TABLE task_comments ADD COLUMN team_id BIGINT;
        
        -- Backfill team_id from parent task
        UPDATE task_comments tc
        SET team_id = t.team_id
        FROM tasks t
        WHERE tc.task_id = t.id;
        
        ALTER TABLE task_comments ADD CONSTRAINT fk_task_comments_team 
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Ensure task_history has team_id with Foreign Key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_history' AND column_name = 'team_id'
    ) THEN
        ALTER TABLE task_history ADD COLUMN team_id BIGINT;
        
        -- Backfill team_id from parent task
        UPDATE task_history th
        SET team_id = t.team_id
        FROM tasks t
        WHERE th.task_id = t.id;
        
        ALTER TABLE task_history ADD CONSTRAINT fk_task_history_team 
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Update team_members unique constraints to support historical memberships
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS uk_team_member_user;
DROP INDEX IF EXISTS uk_team_member_user;

CREATE UNIQUE INDEX IF NOT EXISTS uk_active_team_member_user 
    ON team_members (user_id) WHERE is_active = true;

-- 4. Create performance indexes for all team-scoped queries
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_assignee ON tasks(team_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_status ON tasks(team_id, status);

CREATE INDEX IF NOT EXISTS idx_homework_team_id ON homework(team_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_team ON homework_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_team_user ON homework_submissions(team_id, user_id);

CREATE INDEX IF NOT EXISTS idx_standups_team_id ON standups(team_id);
CREATE INDEX IF NOT EXISTS idx_standups_team_date ON standups(team_id, date);
CREATE INDEX IF NOT EXISTS idx_standups_team_user ON standups(team_id, user_id);

CREATE INDEX IF NOT EXISTS idx_blockers_team_id ON blockers(team_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_team_id ON follow_ups(team_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_team_id ON lead_messages(team_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_team_id ON task_comments(team_id);
CREATE INDEX IF NOT EXISTS idx_task_history_team_id ON task_history(team_id);
