CREATE TABLE IF NOT EXISTS standup_pdfs (
    id BIGSERIAL PRIMARY KEY,
    standup_id BIGINT REFERENCES standups(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    report_type VARCHAR(20) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    pdf_data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_standup_pdfs_lookup ON standup_pdfs(report_type, report_date, user_id, team_id);
