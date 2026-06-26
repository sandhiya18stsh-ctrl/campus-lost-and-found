# PostgreSQL Database Setup Guide

This guide provides step-by-step instructions for setting up PostgreSQL for the Campus Lost & Found Network application.

## Prerequisites

- PostgreSQL 12 or higher (PostgreSQL 15+ recommended)
- pgAdmin (optional, for GUI management)
- System administrator privileges

## Installation Options

### Option 1: Windows Installation

1. Download PostgreSQL from [EnterpriseDB](https://www.enterprisedb.com/downloads/postgres-postgresql/) or [PostgreSQL Official Site](https://www.postgresql.org/download/windows/)
2. Run the installer with default settings
3. Set superuser password (remember this password)
4. Install pgAdmin (recommended for GUI management)
5. Note the default port (usually 5432)

### Option 2: macOS Installation

**Using Homebrew:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Using Installer:**
1. Download from [PostgreSQL for Mac](https://www.postgresql.org/download/macosx/)
2. Run the installer package
3. Follow the installation wizard
4. Set superuser password

### Option 3: Linux Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Database Configuration

### Step 1: Start PostgreSQL Service

**Windows:**
- PostgreSQL runs automatically as a service
- Check Services to verify it's running

**macOS/Linux:**
```bash
# macOS
brew services start postgresql@15

# Linux
sudo service postgresql start
# or
sudo systemctl start postgresql
```

### Step 2: Create Database and User

#### Using pgAdmin (Recommended for Windows/macOS)

1. Open pgAdmin
2. Connect to PostgreSQL server (localhost, port 5432)
3. Right-click on "Databases" → Create → Database
4. Name: `campus_lost_found`
5. Owner: Leave as postgres (or create user)
6. Click Save

#### Using psql (Command Line)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE campus_lost_found;
```

#### Creating Dedicated User

```bash
# In psql
CREATE USER campus_lost_found WITH PASSWORD 'CampusLostFound123';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campus_lost_found TO campus_lost_found;
```

### Step 3: Test Connection

```bash
# Test connection
psql -U campus_lost_found -d campus_lost_found

# Or using full connection string
psql "postgresql://campus_lost_found:CampusLostFound123@localhost:5432/campus_lost_found"
```

## Running Database Scripts

The project includes SQL scripts in the `database/` directory for setting up the database schema.

### Method 1: Using psql Command Line

```bash
# Navigate to project directory
cd "C:\Users\sandh\.devin\full stack"

# Run master setup script
psql -U campus_lost_found -d campus_lost_found -f database/00_master_setup.sql
```

### Method 2: Using pgAdmin

1. Open pgAdmin and connect to the database
2. Click on "Query Tool" button (or Tools → Query Tool)
3. Open each script file and execute:
   - Open `database/01_create_database.sql` → Execute (if needed)
   - Open `database/03_create_tables.sql` → Execute
   - Open `database/04_create_constraints.sql` → Execute
   - Open `database/05_create_indexes.sql` → Execute
   - Open `database/06_create_triggers.sql` → Execute
   - Open `database/07_insert_sample_data.sql` → Execute

### Method 3: Using pgAdmin Restore

1. Create a file with all scripts combined
2. Right-click on database → Restore
3. Select the file and restore

## Verify Database Setup

After running the scripts, verify the setup:

```sql
-- Connect to database
\c campus_lost_found

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected output:
```
table_name
-----------
categories
claims
found_items
item_images
locations
lost_items
notifications
users
```

```sql
-- Check sample data
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'lost_items', COUNT(*) FROM lost_items
UNION ALL
SELECT 'found_items', COUNT(*) FROM found_items
UNION ALL
SELECT 'claims', COUNT(*) FROM claims;
```

Expected output:
```
table_name | row_count
-----------+-----------
users      |         6
lost_items  |         8
found_items |         8
claims      |         4
```

## Connection String Configuration

Update the backend `.env` file with your PostgreSQL connection string:

```
DATABASE_URL=postgresql://campus_lost_found:CampusLostFound123@localhost:5432/campus_lost_found
```

### Connection String Format

```
postgresql://username:password@host:port/database
```

### Common Configurations

**Local Development:**
```
postgresql://campus_lost_found:password@localhost:5432/campus_lost_found
```

**Unix Socket (Linux):**
```
postgresql://campus_lost_found:password@/campus_lost_found
```

**Remote Server:**
```
postgresql://campus_lost_found:password@your-server.com:5432/campus_lost_found
```

## Troubleshooting

### Issue: "Connection refused"

**Solution:**
```bash
# Check if PostgreSQL is running
# Windows: Check Services
# macOS/Linux:
pg_ctl status -D /usr/local/var/postgres  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL if not running
pg_ctl start -D /usr/local/var/postgres  # macOS
sudo systemctl start postgresql  # Linux
```

### Issue: "FATAL: password authentication failed"

**Solution:**
```sql
-- Reset user password
ALTER USER campus_lost_found WITH PASSWORD 'NewPassword123';
```

### Issue: "FATAL: database "campus_lost_found" does not exist"

**Solution:**
```sql
-- Create database
CREATE DATABASE campus_lost_found;
```

### Issue: Permission Denied

**Solution:**
```sql
-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campus_lost_found TO campus_lost_found;
GRANT ALL PRIVILEGES ON SCHEMA public TO campus_lost_found;
```

### Issue: psycopg2 Installation Error

**Solution:**
```bash
# Install PostgreSQL development headers
# Ubuntu/Debian
sudo apt-get install libpq-dev build-essential python3-dev

# macOS
brew install postgresql
brew link --overwrite postgresql

# Windows (if using binary installer)
psycopg2-binary should work out of the box
```

## Security Best Practices

### Change Default Passwords

```sql
ALTER USER campus_lost_found WITH PASSWORD 'YourStrongPassword123!';
```

### Enable Password Expiration (Optional)

```sql
ALTER USER campus_lost_found WITH VALID UNTIL '2025-12-31';
```

### Create Read-Only User (Optional)

```sql
CREATE USER campus_lost_found_readonly WITH PASSWORD 'ReadOnlyPassword';
GRANT CONNECT ON DATABASE campus_lost_found TO campus_lost_found_readonly;
GRANT USAGE ON SCHEMA public TO campus_lost_found_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO campus_lost_found_readonly;
```

## Backup and Recovery

### Using pg_dump (Backup)

```bash
# Backup entire database
pg_dump -U campus_lost_found -d campus_lost_found > backup.sql

# Backup with custom options
pg_dump -U campus_lost_found -d campus_lost_found --clean --if-exists > backup.sql

# Compressed backup
pg_dump -U campus_lost_found -d campus_lost_found | gzip > backup.sql.gz
```

### Using pg_restore (Restore)

```bash
# Restore from backup
psql -U campus_lost_found -d campus_lost_found < backup.sql

# Restore compressed backup
gunzip < backup.sql.gz | psql -U campus_lost_found -d campus_lost_found
```

### Using pgAdmin

1. Right-click on database → Backup
2. Select backup options and file location
3. To restore: Right-click → Restore → Select file

## Performance Tuning

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### Vacuum and Analyze

```sql
-- Reclaim storage and update statistics
VACUUM ANALYZE;
```

## Monitoring

### Check Active Connections

```sql
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start
FROM pg_stat_activity
WHERE datname = 'campus_lost_found';
```

### Check Locks

```sql
SELECT 
    pid,
    relation::regclass,
    mode,
    granted
FROM pg_locks
WHERE relation IS NOT NULL;
```

### Check Slow Queries

```sql
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Configuration Optimization

### Edit postgresql.conf (Optional)

Location varies by OS:
- **Windows**: `C:\Program Files\PostgreSQL\15\data\postgresql.conf`
- **macOS**: `/usr/local/var/postgres/postgresql.conf`
- **Linux**: `/etc/postgresql/15/main/postgresql.conf`

**Recommended Settings:**

```ini
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# Connection settings
max_connections = 100

# Logging
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'mod'
```

### Restart PostgreSQL After Config Changes

```bash
# Windows: Use Services
# macOS/Linux:
pg_ctl restart -D /usr/local/var/postgres  # macOS
sudo systemctl restart postgresql  # Linux
```

## Next Steps

After completing the database setup:

1. Update backend `.env` with your PostgreSQL credentials
2. Install Python dependencies: `pip install -r requirements.txt`
3. Test database connection by running the backend
4. Verify API endpoints are working correctly
5. Test the frontend application

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)
- [SQLAlchemy PostgreSQL Documentation](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)
