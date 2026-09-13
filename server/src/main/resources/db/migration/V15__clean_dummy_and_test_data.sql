-- V15: Clean all dummy and test data to establish an authentic clean-state multi-team database

-- 1. Remove all operational child records respecting foreign key dependencies
DELETE FROM task_comments;
DELETE FROM task_history;
DELETE FROM task_labels;
DELETE FROM tasks;
DELETE FROM standup_pdfs;
DELETE FROM follow_ups;
DELETE FROM blockers;
DELETE FROM standups;
DELETE FROM homework_reminders;
DELETE FROM homework_submissions;
DELETE FROM homework;
DELETE FROM lead_messages;
DELETE FROM leadership_assignments;
DELETE FROM learning_progress;
DELETE FROM problem_attempts;

-- 2. Remove all test team memberships, teams, and test users
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM users;

-- 3. Reset table identity sequences so fresh real registrations start cleanly
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS teams_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS team_members_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS leadership_assignments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS standups_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS homework_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS homework_submissions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS lead_messages_id_seq RESTART WITH 1;
