-- Campus Lost & Found Network
-- Database Creation Script (PostgreSQL)
-- Execute in PostgreSQL as superuser

-- Drop existing database and user if they exist
DROP DATABASE IF EXISTS campus_lost_found;
DROP USER IF EXISTS campus_lost_found;

-- Create user
CREATE USER campus_lost_found WITH PASSWORD 'CampusLostFound123';

-- Create database
CREATE DATABASE campus_lost_found OWNER campus_lost_found ENCODING 'UTF8';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campus_lost_found TO campus_lost_found;

-- Connect to the new database
\c campus_lost_found

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO campus_lost_found;

-- Display success message
SELECT 'Database created successfully!' AS Status;
