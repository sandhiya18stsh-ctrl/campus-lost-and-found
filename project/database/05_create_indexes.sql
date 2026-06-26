-- Campus Lost & Found Network
-- Indexes Creation Script (PostgreSQL)
-- Execute as campus_lost_found user

-- Connect to the database
-- \c campus_lost_found campus_lost_found

-- Performance Indexes

-- Email lookup index
CREATE INDEX idx_users_email ON users(email);

-- Lost items indexes
CREATE INDEX idx_lost_items_status ON lost_items(status);
CREATE INDEX idx_lost_items_date ON lost_items(date_lost);
CREATE INDEX idx_lost_items_user ON lost_items(user_id);
CREATE INDEX idx_lost_items_category ON lost_items(category_id);
CREATE INDEX idx_lost_items_location ON lost_items(location_id);

-- Found items indexes
CREATE INDEX idx_found_items_status ON found_items(status);
CREATE INDEX idx_found_items_date ON found_items(date_found);
CREATE INDEX idx_found_items_user ON found_items(user_id);
CREATE INDEX idx_found_items_category ON found_items(category_id);
CREATE INDEX idx_found_items_location ON found_items(location_id);

-- Claims indexes
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_lost_item ON claims(lost_item_id);
CREATE INDEX idx_claims_found_item ON claims(found_item_id);
CREATE INDEX idx_claims_claimant ON claims(claimant_id);

-- Item images indexes
CREATE INDEX idx_item_images_lost ON item_images(lost_item_id);
CREATE INDEX idx_item_images_found ON item_images(found_item_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_read ON notifications(is_read);

COMMIT;

-- Display success message
SELECT 'Indexes created successfully!' AS Status;
