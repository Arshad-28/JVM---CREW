-- =========================================================================
-- V18: Create Interview Lab Tables and Indexes
-- =========================================================================

-- 1. Learning Sessions
CREATE TABLE IF NOT EXISTS interview_learning_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    topic VARCHAR(255) NOT NULL,
    technology VARCHAR(100),
    user_input TEXT NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    summary TEXT,
    key_concepts_json TEXT,
    examples_json TEXT,
    common_mistakes_json TEXT,
    interview_relevance TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Practice Questions
CREATE TABLE IF NOT EXISTS interview_practice_questions (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES interview_learning_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    options_json TEXT,
    hint TEXT,
    sample_answer TEXT,
    explanation TEXT,
    sequence_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 3. Practice Attempts
CREATE TABLE IF NOT EXISTS interview_practice_attempts (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES interview_practice_questions(id) ON DELETE CASCADE,
    session_id BIGINT NOT NULL REFERENCES interview_learning_sessions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    score INT NOT NULL,
    what_you_got_right TEXT,
    what_is_missing TEXT,
    technical_correction TEXT,
    better_interview_answer TEXT,
    interview_tip TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 4. Mock Interview Sessions
CREATE TABLE IF NOT EXISTS interview_mock_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    technology VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    interview_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    target_questions INT NOT NULL DEFAULT 5,
    current_question_index INT NOT NULL DEFAULT 0,
    overall_score INT,
    performance_rating VARCHAR(50),
    report_json TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Mock Interview Questions
CREATE TABLE IF NOT EXISTS interview_mock_questions (
    id BIGSERIAL PRIMARY KEY,
    mock_session_id BIGINT NOT NULL REFERENCES interview_mock_sessions(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,
    question_text TEXT NOT NULL,
    category VARCHAR(100),
    difficulty VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 6. Mock Interview Answers
CREATE TABLE IF NOT EXISTS interview_mock_answers (
    id BIGSERIAL PRIMARY KEY,
    mock_question_id BIGINT NOT NULL REFERENCES interview_mock_questions(id) ON DELETE CASCADE,
    mock_session_id BIGINT NOT NULL REFERENCES interview_mock_sessions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    score INT NOT NULL,
    feedback_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 7. Coding Problems
CREATE TABLE IF NOT EXISTS interview_coding_problems (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES interview_learning_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    examples_json TEXT,
    constraints_json TEXT,
    starter_code TEXT,
    solution_approach TEXT,
    hint TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 8. Coding Attempts
CREATE TABLE IF NOT EXISTS interview_coding_attempts (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT NOT NULL REFERENCES interview_coding_problems(id) ON DELETE CASCADE,
    session_id BIGINT NOT NULL REFERENCES interview_learning_sessions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'JAVA',
    status VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    review_feedback_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 9. Coach Messages
CREATE TABLE IF NOT EXISTS interview_coach_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES interview_learning_sessions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 10. User Weaknesses
CREATE TABLE IF NOT EXISTS interview_user_weaknesses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    weak_concept VARCHAR(255) NOT NULL,
    total_attempts INT NOT NULL DEFAULT 1,
    total_score INT NOT NULL DEFAULT 0,
    average_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    last_attempted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_user_topic_weakness UNIQUE (user_id, topic, weak_concept)
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_ils_user_id ON interview_learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ils_team_id ON interview_learning_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_ils_created_at ON interview_learning_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ipq_session_id ON interview_practice_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_ipa_user_session ON interview_practice_attempts(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ipa_question_id ON interview_practice_attempts(question_id);

CREATE INDEX IF NOT EXISTS idx_ims_user_id ON interview_mock_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ims_team_id ON interview_mock_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_ims_started_at ON interview_mock_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_imq_session_id ON interview_mock_questions(mock_session_id);
CREATE INDEX IF NOT EXISTS idx_ima_user_session ON interview_mock_answers(user_id, mock_session_id);
CREATE INDEX IF NOT EXISTS idx_ima_question_id ON interview_mock_answers(mock_question_id);

CREATE INDEX IF NOT EXISTS idx_icp_session_id ON interview_coding_problems(session_id);
CREATE INDEX IF NOT EXISTS idx_ica_user_problem ON interview_coding_attempts(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_icm_user_session ON interview_coach_messages(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_iuw_user_id ON interview_user_weaknesses(user_id);
