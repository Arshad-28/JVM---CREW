-- V1__initial_schema.sql: Initial schema migration for JVM Crew Operating System

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    CONSTRAINT uk_team_member_user UNIQUE (user_id)
);

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    deadline DATE,
    progress_pct INT DEFAULT 0,
    est_hours DOUBLE PRECISION,
    actual_hours DOUBLE PRECISION
);

CREATE TABLE task_labels (
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL
);

CREATE TABLE task_history (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    field_changed VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE task_comments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE standups (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    yesterday_work TEXT,
    today_plan TEXT,
    blockers TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE blockers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    standup_id BIGINT REFERENCES standups(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE homework (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(255) NOT NULL,
    deadline DATE,
    est_hours DOUBLE PRECISION,
    is_published BOOLEAN DEFAULT FALSE,
    solution_notes TEXT,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE homework_submissions (
    id BIGSERIAL PRIMARY KEY,
    homework_id BIGINT NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    submission_notes TEXT,
    code_url VARCHAR(500),
    feedback_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE homework_reminders (
    id BIGSERIAL PRIMARY KEY,
    homework_id BIGINT NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminded_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    note VARCHAR(255)
);

CREATE TABLE learning_topics (
    id BIGSERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    order_index INT NOT NULL
);

CREATE TABLE learning_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_user_topic UNIQUE (user_id, topic_id)
);

CREATE TABLE problems (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) NOT NULL
);

CREATE TABLE problem_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    time_taken_min INT,
    attempts INT DEFAULT 1,
    solved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE follow_ups (
    id BIGSERIAL PRIMARY KEY,
    member_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE lead_messages (
    id BIGSERIAL PRIMARY KEY,
    member_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE
);
