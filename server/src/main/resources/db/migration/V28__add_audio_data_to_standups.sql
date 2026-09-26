-- V28__add_audio_data_to_standups.sql
-- Add audio_data binary column to standups table for permanent audio persistence across container restarts

ALTER TABLE standups ADD COLUMN IF NOT EXISTS audio_data BYTEA;
