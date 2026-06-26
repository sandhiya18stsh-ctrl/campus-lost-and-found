-- Campus Lost & Found Network
-- Tables Creation Script (PostgreSQL)
-- Execute as campus_lost_found user

-- Connect to the database
-- \c campus_lost_found campus_lost_found

-- Drop tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS item_images CASCADE;
DROP TABLE IF EXISTS found_items CASCADE;
DROP TABLE IF EXISTS lost_items CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create USERS table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    student_id VARCHAR(20) UNIQUE,
    department VARCHAR(100),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create CATEGORIES table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create LOCATIONS table
CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    building VARCHAR(50),
    floor VARCHAR(20),
    description VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create LOST_ITEMS table
CREATE TABLE lost_items (
    lost_item_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    location_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    brand VARCHAR(50),
    color VARCHAR(50),
    date_lost DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create FOUND_ITEMS table
CREATE TABLE found_items (
    found_item_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    location_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    brand VARCHAR(50),
    color VARCHAR(50),
    date_found DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE' NOT NULL,
    storage_location VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ITEM_IMAGES table
CREATE TABLE item_images (
    image_id SERIAL PRIMARY KEY,
    lost_item_id INTEGER,
    found_item_id INTEGER,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create CLAIMS table
CREATE TABLE claims (
    claim_id SERIAL PRIMARY KEY,
    lost_item_id INTEGER NOT NULL,
    found_item_id INTEGER NOT NULL,
    claimant_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
    verification_notes VARCHAR(2000),
    verified_by INTEGER,
    verified_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create NOTIFICATIONS table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    related_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;

-- Display success message
SELECT 'Tables created successfully!' AS Status;
