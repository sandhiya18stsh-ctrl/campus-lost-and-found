-- Campus Lost & Found Network
-- Sample Data Insertion Script (PostgreSQL)
-- Execute as campus_lost_found user

-- Connect to the database
-- \c campus_lost_found campus_lost_found

-- Insert Categories
INSERT INTO categories (category_id, name, description, is_active) VALUES
(1, 'Electronics', 'Electronic devices including phones, laptops, tablets', TRUE),
(2, 'Books & Supplies', 'Textbooks, notebooks, school supplies', TRUE),
(3, 'Clothing', 'Jackets, hats, accessories, footwear', TRUE),
(4, 'ID Cards', 'Student ID, driver''s license, other cards', TRUE),
(5, 'Keys', 'Room keys, car keys, locker keys', TRUE),
(6, 'Bags & Backpacks', 'Backpacks, purses, tote bags', TRUE),
(7, 'Jewelry', 'Watches, rings, necklaces, accessories', TRUE),
(8, 'Sports Equipment', 'Sports gear, equipment, accessories', TRUE),
(9, 'Water Bottles', 'Reusable bottles, containers', TRUE),
(10, 'Miscellaneous', 'Items that don''t fit other categories', TRUE);

-- Insert Locations
INSERT INTO locations (location_id, name, building, floor, description, is_active) VALUES
(1, 'Main Library', 'Library Building', 'All Floors', 'Main campus library', TRUE),
(2, 'Student Center', 'Student Center', '1st Floor', 'Student center cafeteria and lounge', TRUE),
(3, 'Gymnasium', 'Sports Complex', 'Main Floor', 'Main gym and locker rooms', TRUE),
(4, 'Engineering Building', 'Engineering Hall', 'All Floors', 'Engineering classrooms and labs', TRUE),
(5, 'Science Building', 'Science Hall', 'All Floors', 'Science laboratories and classrooms', TRUE),
(6, 'Dining Hall', 'Student Center', '2nd Floor', 'Main dining hall', TRUE),
(7, 'Computer Lab', 'Engineering Hall', '2nd Floor', 'Public computer laboratory', TRUE),
(8, 'Study Room', 'Library Building', '3rd Floor', 'Quiet study area', TRUE),
(9, 'Parking Lot A', 'Ground Level', 'Outdoor', 'Main parking area', TRUE),
(10, 'Campus Bus Stop', 'Various', 'Outdoor', 'Campus transportation stops', TRUE);

-- Insert Users (passwords are bcrypt hashed - use proper hashing in production)
INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, role, student_id, department, is_active) VALUES
(1, 'admin@campus.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5N1wIqYY1HOBi', 'Admin', 'User', '555-0101', 'ADMIN', NULL, 'IT Services', TRUE),
(2, 'student1@campus.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5N1wIqYY1HOBi', 'John', 'Smith', '555-0102', 'STUDENT', 'S12345', 'Computer Science', TRUE),
(3, 'student2@campus.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5N1wIqYY1HOBi', 'Jane', 'Doe', '555-0103', 'STUDENT', 'S12346', 'Engineering', TRUE),
(4, 'staff1@campus.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5N1wIqYY1HOBi', 'Robert', 'Johnson', '555-0104', 'STAFF', NULL, 'Facilities', TRUE),
(5, 'student3@campus.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5N1wIqYY1HOBi', 'Emily', 'Davis', '555-0105', 'STUDENT', 'S12347', 'Business', TRUE),
(6, 'student4@campus.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5N1wIqYY1HOBi', 'Michael', 'Wilson', '555-0106', 'STUDENT', 'S12348', 'Arts', TRUE);

-- Insert Lost Items
INSERT INTO lost_items (lost_item_id, user_id, category_id, location_id, title, description, brand, color, date_lost, status, is_featured) VALUES
(1, 2, 1, 1, 'iPhone 13 Pro', 'Lost my iPhone in the library. It has a blue case and a cracked screen protector.', 'Apple', 'Blue', '2024-01-15', 'OPEN', TRUE),
(2, 3, 6, 2, 'Black Backpack', 'North Face backpack with laptop compartment. Contains textbooks and laptop.', 'North Face', 'Black', '2024-01-14', 'OPEN', FALSE),
(3, 2, 2, 4, 'Calculus Textbook', 'James Stewart Calculus 8th edition. Has my name written inside.', 'Cengage', 'Blue', '2024-01-13', 'OPEN', FALSE),
(4, 5, 4, 3, 'Student ID Card', 'Lost my student ID at the gym. Name on card is Emily Davis.', NULL, 'White', '2024-01-12', 'OPEN', TRUE),
(5, 6, 5, 6, 'Car Keys with Keychain', 'Toyota car keys with a university keychain.', 'Toyota', 'Silver', '2024-01-11', 'OPEN', FALSE),
(6, 3, 3, 1, 'Blue Jacket', 'Columbia blue windbreaker jacket, size M.', 'Columbia', 'Blue', '2024-01-10', 'OPEN', FALSE),
(7, 5, 1, 7, 'MacBook Pro 14"', 'Silver MacBook Pro with stickers on the back. 16GB RAM, 512GB storage.', 'Apple', 'Silver', '2024-01-09', 'OPEN', TRUE),
(8, 2, 7, 2, 'Silver Watch', 'Fossil silver watch with black leather band.', 'Fossil', 'Silver', '2024-01-08', 'OPEN', FALSE);

-- Insert Found Items
INSERT INTO found_items (found_item_id, user_id, category_id, location_id, title, description, brand, color, date_found, status, storage_location, is_featured) VALUES
(1, 4, 1, 1, 'Smart Phone', 'iPhone found in library study area. Blue case with cracked screen protector.', 'Apple', 'Blue', '2024-01-15', 'AVAILABLE', 'Lost & Found Office', TRUE),
(2, 4, 6, 2, 'Backpack', 'Black North Face backpack found in student center. Contains laptop and books.', 'North Face', 'Black', '2024-01-14', 'AVAILABLE', 'Lost & Found Office', FALSE),
(3, 2, 2, 1, 'Math Textbook', 'Calculus textbook found in library. Has notes written inside.', 'Cengage', 'Blue', '2024-01-13', 'AVAILABLE', 'Library Front Desk', FALSE),
(4, 4, 4, 3, 'ID Card', 'Student ID card found at gym. Name: Emily Davis', NULL, 'White', '2024-01-12', 'AVAILABLE', 'Gym Front Desk', TRUE),
(5, 4, 5, 6, 'Car Keys', 'Toyota car keys with university keychain found in dining hall.', 'Toyota', 'Silver', '2024-01-11', 'AVAILABLE', 'Lost & Found Office', FALSE),
(6, 2, 3, 1, 'Blue Windbreaker', 'Columbia blue jacket found in library. Size M.', 'Columbia', 'Blue', '2024-01-10', 'AVAILABLE', 'Library Lost & Found', FALSE),
(7, 4, 1, 7, 'Laptop Computer', 'Silver MacBook Pro found in computer lab. Has stickers on back.', 'Apple', 'Silver', '2024-01-09', 'AVAILABLE', 'IT Services', TRUE),
(8, 2, 9, 2, 'Water Bottle', 'Blue Hydro Flask water bottle with name sticker.', 'Hydro Flask', 'Blue', '2024-01-08', 'AVAILABLE', 'Student Center', FALSE);

-- Insert Item Images (placeholder URLs)
INSERT INTO item_images (image_id, lost_item_id, found_item_id, image_url, is_primary) VALUES
(1, 1, NULL, '/images/lost/iphone13pro.jpg', TRUE),
(2, 2, NULL, '/images/lost/backpack.jpg', TRUE),
(3, 3, NULL, '/images/lost/calculus_book.jpg', TRUE),
(4, 4, NULL, '/images/lost/id_card.jpg', TRUE),
(5, 7, NULL, '/images/lost/macbook_pro.jpg', TRUE),
(6, NULL, 1, '/images/found/iphone.jpg', TRUE),
(7, NULL, 2, '/images/found/backpack.jpg', TRUE),
(8, NULL, 4, '/images/found/id_card.jpg', TRUE),
(9, NULL, 7, '/images/found/laptop.jpg', TRUE);

-- Insert Claims
INSERT INTO claims (claim_id, lost_item_id, found_item_id, claimant_id, status, verification_notes, verified_by, verified_at, completed_at) VALUES
(1, 1, 1, 2, 'PENDING', 'Claiming my lost iPhone. Can provide proof of purchase.', NULL, NULL, NULL),
(2, 2, 2, 3, 'APPROVED', 'Verified ownership with laptop serial number.', 1, '2024-01-16 10:30:00', '2024-01-16 11:00:00'),
(3, 4, 4, 5, 'PENDING', 'This is my student ID. Can verify with photo ID.', NULL, NULL, NULL),
(4, 7, 7, 5, 'PENDING', 'Claiming my MacBook Pro. Serial number: C02XYZ123.', NULL, NULL, NULL);

-- Insert Notifications
INSERT INTO notifications (notification_id, user_id, type, title, message, related_id, is_read) VALUES
(1, 2, 'CLAIM', 'Claim Status Update', 'Your claim for iPhone 13 Pro has been submitted and is pending review.', 1, FALSE),
(2, 3, 'CLAIM', 'Claim Approved', 'Your claim for Black Backpack has been approved. Please pick it up from Lost & Found Office.', 2, FALSE),
(3, 5, 'MATCH', 'Potential Match Found', 'We found an item that matches your lost Student ID Card. Check Found Items to submit a claim.', 4, FALSE),
(4, 5, 'SYSTEM', 'Welcome', 'Welcome to Campus Lost & Found Network! Report your lost items or browse found items.', NULL, FALSE),
(5, 1, 'SYSTEM', 'New Claim to Review', 'A new claim requires your review and approval.', 1, FALSE),
(6, 5, 'CLAIM', 'Claim Status Update', 'Your claim for MacBook Pro 14" has been submitted and is pending review.', 4, FALSE);

COMMIT;

-- Display success message
SELECT 'Sample data inserted successfully!' AS Status;

-- Verify data counts
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Locations: ' || COUNT(*) FROM locations;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Lost Items: ' || COUNT(*) FROM lost_items;
SELECT 'Found Items: ' || COUNT(*) FROM found_items;
SELECT 'Item Images: ' || COUNT(*) FROM item_images;
SELECT 'Claims: ' || COUNT(*) FROM claims;
SELECT 'Notifications: ' || COUNT(*) FROM notifications;
