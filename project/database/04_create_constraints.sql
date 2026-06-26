-- Campus Lost & Found Network
-- Constraints Creation Script (PostgreSQL)
-- Execute as campus_lost_found user

-- Connect to the database
-- \c campus_lost_found campus_lost_found

-- Foreign Key Constraints

-- LOST_ITEMS foreign keys
ALTER TABLE lost_items
ADD CONSTRAINT fk_lost_items_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE lost_items
ADD CONSTRAINT fk_lost_items_category
FOREIGN KEY (category_id) REFERENCES categories(category_id);

ALTER TABLE lost_items
ADD CONSTRAINT fk_lost_items_location
FOREIGN KEY (location_id) REFERENCES locations(location_id);

-- FOUND_ITEMS foreign keys
ALTER TABLE found_items
ADD CONSTRAINT fk_found_items_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE found_items
ADD CONSTRAINT fk_found_items_category
FOREIGN KEY (category_id) REFERENCES categories(category_id);

ALTER TABLE found_items
ADD CONSTRAINT fk_found_items_location
FOREIGN KEY (location_id) REFERENCES locations(location_id);

-- ITEM_IMAGES foreign keys
ALTER TABLE item_images
ADD CONSTRAINT fk_item_images_lost
FOREIGN KEY (lost_item_id) REFERENCES lost_items(lost_item_id);

ALTER TABLE item_images
ADD CONSTRAINT fk_item_images_found
FOREIGN KEY (found_item_id) REFERENCES found_items(found_item_id);

-- CLAIMS foreign keys
ALTER TABLE claims
ADD CONSTRAINT fk_claims_lost
FOREIGN KEY (lost_item_id) REFERENCES lost_items(lost_item_id);

ALTER TABLE claims
ADD CONSTRAINT fk_claims_found
FOREIGN KEY (found_item_id) REFERENCES found_items(found_item_id);

ALTER TABLE claims
ADD CONSTRAINT fk_claims_claimant
FOREIGN KEY (claimant_id) REFERENCES users(user_id);

ALTER TABLE claims
ADD CONSTRAINT fk_claims_verifier
FOREIGN KEY (verified_by) REFERENCES users(user_id);

-- NOTIFICATIONS foreign keys
ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Additional Check Constraints

ALTER TABLE users
ADD CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'STAFF', 'ADMIN'));

ALTER TABLE lost_items
ADD CONSTRAINT chk_lost_items_status CHECK (status IN ('OPEN', 'MATCHED', 'CLAIMED', 'CLOSED'));

ALTER TABLE found_items
ADD CONSTRAINT chk_found_items_status CHECK (status IN ('AVAILABLE', 'CLAIMED', 'RETURNED', 'DISPOSED'));

ALTER TABLE claims
ADD CONSTRAINT chk_claims_status CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED'));

-- One active claim per user per found item (pending, under review, or approved)
CREATE UNIQUE INDEX uq_claims_claimant_found_active
ON claims (found_item_id, claimant_id)
WHERE status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED');

-- Ensure either LOST_ITEM_ID or FOUND_ITEM_ID is set in ITEM_IMAGES
ALTER TABLE item_images
ADD CONSTRAINT chk_item_images_item_ref CHECK (
    (lost_item_id IS NOT NULL AND found_item_id IS NULL) OR
    (lost_item_id IS NULL AND found_item_id IS NOT NULL)
);

COMMIT;

-- Display success message
SELECT 'Constraints created successfully!' AS Status;
