-- V25__add_auth_user_id_to_users.sql: Add Supabase Auth UUID identity mapping and relax password_hash constraint

-- 1. Add auth_user_id column to link with Supabase Auth (auth.users.id)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- 2. Create unique index for Supabase auth_user_id lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- 3. Allow password_hash to be nullable since passwords are now securely hashed and managed by Supabase Auth
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
