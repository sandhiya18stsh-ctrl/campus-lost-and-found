-- Campus Lost & Found Network
-- Master Database Setup Script (PostgreSQL)
-- Execute in PostgreSQL as superuser

SET ECHO ON

PROMPT ========================================
PROMPT Campus Lost & Found Network Database Setup
PROMPT PostgreSQL Version
PROMPT ========================================

PROMPT Step 1: Creating database and user...
\i database/01_create_database.sql

PROMPT Step 2: Connecting to database...
\c campus_lost_found campus_lost_found

PROMPT Step 3: Creating sequences...
\i database/02_create_sequences.sql

PROMPT Step 4: Creating tables...
\i database/03_create_tables.sql

PROMPT Step 5: Creating constraints...
\i database/04_create_constraints.sql

PROMPT Step 6: Creating indexes...
\i database/05_create_indexes.sql

PROMPT Step 7: Creating triggers...
\i database/06_create_triggers.sql

PROMPT Step 8: Inserting sample data...
\i database/07_insert_sample_data.sql

PROMPT ========================================
PROMPT Database setup completed successfully!
PROMPT ========================================
