-- Migration: add optional profile picture URL to users
-- Run against an existing campus_lost_found database

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

COMMIT;

SELECT 'User avatar column added!' AS status;
