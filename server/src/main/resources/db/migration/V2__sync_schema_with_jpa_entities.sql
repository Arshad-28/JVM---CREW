-- V2__sync_schema_with_jpa_entities.sql
-- Synchronize PostgreSQL schema with all current JPA entity definitions

-- 1. team_members
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- 2. tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- 3. task_history
ALTER TABLE task_history ADD COLUMN IF NOT EXISTS changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_history' AND column_name = 'changed_by_user_id'
    ) THEN
        UPDATE task_history SET changed_by = changed_by_user_id WHERE changed_by IS NULL AND changed_by_user_id IS NOT NULL;
    END IF;
END $$;

-- 4. blockers
ALTER TABLE blockers ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Untitled Blocker';
ALTER TABLE blockers ADD COLUMN IF NOT EXISTS category VARCHAR(255) NOT NULL DEFAULT 'Technical';
ALTER TABLE blockers ADD COLUMN IF NOT EXISTS assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- 5. standups
ALTER TABLE standups ADD COLUMN IF NOT EXISTS yesterday TEXT NOT NULL DEFAULT '';
ALTER TABLE standups ADD COLUMN IF NOT EXISTS today TEXT NOT NULL DEFAULT '';
ALTER TABLE standups ADD COLUMN IF NOT EXISTS learned TEXT NOT NULL DEFAULT '';
ALTER TABLE standups ADD COLUMN IF NOT EXISTS confidence INT NOT NULL DEFAULT 3;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS has_blockers BOOLEAN DEFAULT FALSE;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS blocker_category VARCHAR(255);
ALTER TABLE standups ADD COLUMN IF NOT EXISTS blocker_duration VARCHAR(255);
ALTER TABLE standups ADD COLUMN IF NOT EXISTS needs_help BOOLEAN DEFAULT FALSE;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS help_description TEXT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS question_for_lead TEXT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS lead_answer TEXT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS lead_answered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS next_step TEXT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS confidence_label VARCHAR(255);
ALTER TABLE standups ADD COLUMN IF NOT EXISTS answers_json TEXT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS questions_json TEXT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS input_methods_json TEXT;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS primary_input_method VARCHAR(50) DEFAULT 'text';
ALTER TABLE standups ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT TRUE;
ALTER TABLE standups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'standups' AND column_name = 'yesterday_work'
    ) THEN
        UPDATE standups SET yesterday = yesterday_work WHERE yesterday = '' AND yesterday_work IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'standups' AND column_name = 'today_plan'
    ) THEN
        UPDATE standups SET today = today_plan WHERE today = '' AND today_plan IS NOT NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_standup_user_date'
    ) THEN
        ALTER TABLE standups ADD CONSTRAINT uk_standup_user_date UNIQUE (user_id, date);
    END IF;
END $$;

-- 6. homework
ALTER TABLE homework ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS creator_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS subject_topic VARCHAR(255) NOT NULL DEFAULT 'Java';
ALTER TABLE homework ADD COLUMN IF NOT EXISTS questions_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE homework ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS due_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
ALTER TABLE homework ADD COLUMN IF NOT EXISTS attachment_data TEXT;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(255);
ALTER TABLE homework ADD COLUMN IF NOT EXISTS solution_text TEXT;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS solution_attachment_name VARCHAR(255);
ALTER TABLE homework ADD COLUMN IF NOT EXISTS solution_attachment_data TEXT;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS solution_attachment_type VARCHAR(255);
ALTER TABLE homework ADD COLUMN IF NOT EXISTS is_solution_published BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS solution_published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE homework ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework' AND column_name = 'subject'
    ) THEN
        UPDATE homework SET subject_topic = subject WHERE subject_topic = 'Java' AND subject IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework' AND column_name = 'description'
    ) THEN
        UPDATE homework SET instructions = description WHERE instructions IS NULL AND description IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework' AND column_name = 'deadline'
    ) THEN
        UPDATE homework SET due_date = deadline WHERE deadline IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework' AND column_name = 'solution_notes'
    ) THEN
        UPDATE homework SET solution_text = solution_notes WHERE solution_text IS NULL AND solution_notes IS NOT NULL;
    END IF;
END $$;

-- 7. homework_submissions
ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS answer_text TEXT;
ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS attachment_data TEXT;
ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(255);
ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS lead_feedback TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework_submissions' AND column_name = 'submission_notes'
    ) THEN
        UPDATE homework_submissions SET notes = submission_notes WHERE notes IS NULL AND submission_notes IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework_submissions' AND column_name = 'feedback_notes'
    ) THEN
        UPDATE homework_submissions SET lead_feedback = feedback_notes WHERE lead_feedback IS NULL AND feedback_notes IS NOT NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_homework_submission_user'
    ) THEN
        ALTER TABLE homework_submissions ADD CONSTRAINT uk_homework_submission_user UNIQUE (homework_id, user_id);
    END IF;
END $$;

-- 8. homework_reminders
ALTER TABLE homework_reminders ADD COLUMN IF NOT EXISTS lead_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE homework_reminders ADD COLUMN IF NOT EXISTS message VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE homework_reminders ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE homework_reminders ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework_reminders' AND column_name = 'reminded_by_user_id'
    ) THEN
        UPDATE homework_reminders SET lead_id = reminded_by_user_id WHERE lead_id IS NULL AND reminded_by_user_id IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework_reminders' AND column_name = 'note'
    ) THEN
        UPDATE homework_reminders SET message = note WHERE message = '' AND note IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework_reminders' AND column_name = 'reminded_at'
    ) THEN
        UPDATE homework_reminders SET sent_at = reminded_at WHERE reminded_at IS NOT NULL;
    END IF;
END $$;

-- 9. learning_topics
ALTER TABLE learning_topics ADD COLUMN IF NOT EXISTS parent_id BIGINT;

-- 10. problem_attempts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_problem_attempt_user_problem'
    ) THEN
        ALTER TABLE problem_attempts ADD CONSTRAINT uk_problem_attempt_user_problem UNIQUE (user_id, problem_id);
    END IF;
END $$;

-- 11. follow_ups
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS lead_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS due_date DATE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'follow_ups' AND column_name = 'member_user_id'
    ) THEN
        UPDATE follow_ups SET user_id = member_user_id WHERE user_id IS NULL AND member_user_id IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'follow_ups' AND column_name = 'lead_user_id'
    ) THEN
        UPDATE follow_ups SET lead_id = lead_user_id WHERE lead_id IS NULL AND lead_user_id IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'follow_ups' AND column_name = 'completed'
    ) THEN
        UPDATE follow_ups SET status = CASE WHEN completed = TRUE THEN 'COMPLETED' ELSE 'PENDING' END;
    END IF;
END $$;

-- 12. lead_messages
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS input_method VARCHAR(50) NOT NULL DEFAULT 'text';
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS related_topic VARCHAR(255);
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS lead_response TEXT;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'member_user_id'
    ) THEN
        UPDATE lead_messages SET user_id = member_user_id WHERE user_id IS NULL AND member_user_id IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'question_text'
    ) THEN
        UPDATE lead_messages SET message = question_text WHERE message = '' AND question_text IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'answer_text'
    ) THEN
        UPDATE lead_messages SET lead_response = answer_text WHERE lead_response IS NULL AND answer_text IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'sent_at'
    ) THEN
        UPDATE lead_messages SET created_at = sent_at WHERE sent_at IS NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'answered_at'
    ) THEN
        UPDATE lead_messages SET responded_at = answered_at WHERE answered_at IS NOT NULL;
    END IF;
END $$;
