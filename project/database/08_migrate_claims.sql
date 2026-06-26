-- Migration: refactor claim system for multi-claimant workflow
-- Run against an existing campus_lost_found database

BEGIN;

-- Migrate legacy COMPLETED status to RETURNED
UPDATE claims SET status = 'RETURNED' WHERE status = 'COMPLETED';

-- Widen verification notes for ownership proof forms
ALTER TABLE claims ALTER COLUMN verification_notes TYPE VARCHAR(2000);

-- Replace status check constraint
ALTER TABLE claims DROP CONSTRAINT IF EXISTS chk_claims_status;
ALTER TABLE claims
ADD CONSTRAINT chk_claims_status
CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED'));

-- Prevent duplicate active claims from the same user on the same found item
DROP INDEX IF EXISTS uq_claims_claimant_found_active;
CREATE UNIQUE INDEX uq_claims_claimant_found_active
ON claims (found_item_id, claimant_id)
WHERE status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED');

COMMIT;

SELECT 'Claim system migration completed!' AS status;
