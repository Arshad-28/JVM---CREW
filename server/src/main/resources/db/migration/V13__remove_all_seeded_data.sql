-- ==============================================================================
-- Flyway Migration V13: Complete Removal of All Seeded/Dummy Data
-- Ensures pristine zero-data starting state for real on-demand registration
-- ==============================================================================

DELETE FROM homework_reminders;
DELETE FROM homework_submissions;
DELETE FROM homework;

DELETE FROM task_comments;
DELETE FROM task_history;
DELETE FROM task_labels;
DELETE FROM tasks;

DELETE FROM blockers;
DELETE FROM follow_ups;
DELETE FROM lead_messages;
DELETE FROM standup_pdfs;
DELETE FROM standups;

DELETE FROM problem_attempts;
DELETE FROM problems;
DELETE FROM learning_progress;
DELETE FROM learning_topics;

DELETE FROM leadership_assignments;
DELETE FROM team_members;
DELETE FROM users;
DELETE FROM teams;
