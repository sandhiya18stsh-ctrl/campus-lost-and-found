-- Campus Lost & Found Network
-- Triggers Creation Script (PostgreSQL)
-- Execute as campus_lost_found user

-- Connect to the database
-- \c campus_lost_found campus_lost_found

-- PostgreSQL doesn't need triggers for auto-increment (SERIAL handles this)
-- We only need triggers for automatic timestamp updates

-- Update Timestamp Triggers

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for USERS table
DROP TRIGGER IF EXISTS trg_users_update ON users;
CREATE TRIGGER trg_users_update
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for LOST_ITEMS table
DROP TRIGGER IF EXISTS trg_lost_items_update ON lost_items;
CREATE TRIGGER trg_lost_items_update
BEFORE UPDATE ON lost_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for FOUND_ITEMS table
DROP TRIGGER IF EXISTS trg_found_items_update ON found_items;
CREATE TRIGGER trg_found_items_update
BEFORE UPDATE ON found_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for CLAIMS table
DROP TRIGGER IF EXISTS trg_claims_update ON claims;
CREATE TRIGGER trg_claims_update
BEFORE UPDATE ON claims
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Display success message
SELECT 'Triggers created successfully!' AS Status;
