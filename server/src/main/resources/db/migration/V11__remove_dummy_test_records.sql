-- V11__remove_dummy_test_records.sql
-- Remove all confirmed dummy, sample, and test records from PostgreSQL
-- Preserving authentic Team 1 (JVM CREW Alpha) and real members (Mohammed Arshad, Kiran, Chidananda, Praveen, Rohanth)

-- 1. Remove test task history and test tasks
DELETE FROM task_history WHERE task_id IN (21, 22, 23, 24, 25, 26, 27, 28) OR task_id IN (SELECT id FROM tasks WHERE team_id > 1 OR assignee_id > 5);
DELETE FROM tasks WHERE id IN (21, 22, 23, 24, 25, 26, 27, 28) OR team_id > 1 OR assignee_id > 5;

-- 2. Remove test leadership assignments
DELETE FROM leadership_assignments WHERE team_id > 1 OR user_id > 5;

-- 3. Clean up superseded leadership assignments for Team 1 to keep exactly one clean active assignment
DELETE FROM leadership_assignments WHERE id IN (1, 5, 6, 10);

-- 4. Remove test team members
DELETE FROM team_members WHERE team_id > 1 OR user_id > 5;

-- 5. Remove test teams
DELETE FROM teams WHERE id > 1;

-- 6. Remove test users (Alex Reed, Brenda Vance, Carlos Diaz, Divya Sharma, Ethan Hunt, etc.)
DELETE FROM users WHERE id > 5;

-- 7. Reset cohort on Team 1 to NULL unless set by real administration
UPDATE teams SET cohort = NULL WHERE id = 1;
