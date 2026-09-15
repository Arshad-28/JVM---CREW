-- =========================================================================
-- V22: Fix legacy column nullability in homework_reminders
-- =========================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework_reminders' AND column_name = 'reminded_by_user_id'
    ) THEN
        ALTER TABLE homework_reminders ALTER COLUMN reminded_by_user_id DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homework_reminders' AND column_name = 'reminded_at'
    ) THEN
        ALTER TABLE homework_reminders ALTER COLUMN reminded_at DROP NOT NULL;
    END IF;
END $$;
