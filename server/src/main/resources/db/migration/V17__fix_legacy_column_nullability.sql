-- =========================================================================
-- V17: Fix legacy column nullability in lead_messages and follow_ups
-- =========================================================================

DO $$
BEGIN
    -- Fix lead_messages legacy columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'member_user_id'
    ) THEN
        ALTER TABLE lead_messages ALTER COLUMN member_user_id DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'lead_user_id'
    ) THEN
        ALTER TABLE lead_messages ALTER COLUMN lead_user_id DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'question_text'
    ) THEN
        ALTER TABLE lead_messages ALTER COLUMN question_text DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_messages' AND column_name = 'sent_at'
    ) THEN
        ALTER TABLE lead_messages ALTER COLUMN sent_at DROP NOT NULL;
    END IF;

    -- Fix follow_ups legacy columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'follow_ups' AND column_name = 'member_user_id'
    ) THEN
        ALTER TABLE follow_ups ALTER COLUMN member_user_id DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'follow_ups' AND column_name = 'lead_user_id'
    ) THEN
        ALTER TABLE follow_ups ALTER COLUMN lead_user_id DROP NOT NULL;
    END IF;
END $$;
