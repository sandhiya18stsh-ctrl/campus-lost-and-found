# Campus Lost & Found Network - Database Schema Design

## Entity Relationship Diagram

```
users (1) ----< (n) lost_items
users (1) ----< (n) found_items
users (1) ----< (n) claims
users (1) ----< (n) notifications

categories (1) ----< (n) lost_items
categories (1) ----< (n) found_items

locations (1) ----< (n) lost_items
locations (1) ----< (n) found_items

lost_items (1) ----< (n) claims
found_items (1) ----< (n) claims

lost_items (1) ----< (n) item_images
found_items (1) ----< (n) item_images
```

## Tables

### 1. users
User accounts with role-based access control

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | SERIAL | PK, NOT NULL | Unique identifier |
| email | VARCHAR(100) | UNIQUE, NOT NULL | User email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| first_name | VARCHAR(50) | NOT NULL | First name |
| last_name | VARCHAR(50) | NOT NULL | Last name |
| phone | VARCHAR(20) | | Phone number |
| role | VARCHAR(20) | NOT NULL | Role: STUDENT, STAFF, ADMIN |
| student_id | VARCHAR(20) | UNIQUE | Student ID (if applicable) |
| department | VARCHAR(100) | | Department/Office |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update date |

### 2. categories
Item categories for organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| category_id | SERIAL | PK, NOT NULL | Unique identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Category name |
| description | VARCHAR(200) | | Description |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

### 3. locations
Campus locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| location_id | SERIAL | PK, NOT NULL | Unique identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Location name |
| building | VARCHAR(50) | | Building name |
| floor | VARCHAR(20) | | Floor/Room |
| description | VARCHAR(200) | | Description |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

### 4. lost_items
Reported lost items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| lost_item_id | SERIAL | PK, NOT NULL | Unique identifier |
| user_id | INTEGER | FK, NOT NULL | Reporter (users) |
| category_id | INTEGER | FK, NOT NULL | Category (categories) |
| location_id | INTEGER | FK | Location lost (locations) |
| title | VARCHAR(200) | NOT NULL | Item title |
| description | VARCHAR(1000) | | Detailed description |
| brand | VARCHAR(50) | | Brand |
| color | VARCHAR(50) | | Color |
| date_lost | DATE | NOT NULL | Date lost |
| status | VARCHAR(20) | DEFAULT 'OPEN' | Status: OPEN, MATCHED, CLAIMED, CLOSED |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured item |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Report date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

### 5. found_items
Reported found items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| found_item_id | SERIAL | PK, NOT NULL | Unique identifier |
| user_id | INTEGER | FK, NOT NULL | Finder (users) |
| category_id | INTEGER | FK, NOT NULL | Category (categories) |
| location_id | INTEGER | FK | Location found (locations) |
| title | VARCHAR(200) | NOT NULL | Item title |
| description | VARCHAR(1000) | | Detailed description |
| brand | VARCHAR(50) | | Brand |
| color | VARCHAR(50) | | Color |
| date_found | DATE | NOT NULL | Date found |
| status | VARCHAR(20) | DEFAULT 'AVAILABLE' | Status: AVAILABLE, CLAIMED, RETURNED, DISPOSED |
| storage_location | VARCHAR(100) | | Current storage location |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured item |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Report date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

### 6. item_images
Images for lost and found items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| image_id | SERIAL | PK, NOT NULL | Unique identifier |
| lost_item_id | INTEGER | FK | Associated lost item |
| found_item_id | INTEGER | FK | Associated found item |
| image_url | VARCHAR(500) | NOT NULL | Image URL/path |
| is_primary | BOOLEAN | DEFAULT FALSE | Primary image |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload date |

### 7. claims
Claims matching lost items to found items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| claim_id | SERIAL | PK, NOT NULL | Unique identifier |
| lost_item_id | INTEGER | FK, NOT NULL | Lost item |
| found_item_id | INTEGER | FK, NOT NULL | Found item |
| claimant_id | INTEGER | FK, NOT NULL | Claimant (users) |
| status | VARCHAR(20) | DEFAULT 'PENDING' | Status: PENDING, APPROVED, REJECTED, COMPLETED |
| verification_notes | VARCHAR(500) | | Admin verification notes |
| verified_by | INTEGER | FK | Admin who verified (users) |
| verified_at | TIMESTAMP | | Verification date |
| completed_at | TIMESTAMP | | Completion date |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Claim date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

### 8. notifications
User notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| notification_id | SERIAL | PK, NOT NULL | Unique identifier |
| user_id | INTEGER | FK, NOT NULL | Recipient (users) |
| type | VARCHAR(50) | NOT NULL | Type: CLAIM, MATCH, STATUS_UPDATE, SYSTEM |
| title | VARCHAR(200) | NOT NULL | Notification title |
| message | VARCHAR(1000) | NOT NULL | Notification message |
| related_id | INTEGER | | Related entity ID |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

## Indexes

### Performance Indexes
- idx_users_email on users(email)
- idx_lost_items_status on lost_items(status)
- idx_lost_items_date on lost_items(date_lost)
- idx_lost_items_user on lost_items(user_id)
- idx_lost_items_category on lost_items(category_id)
- idx_lost_items_location on lost_items(location_id)
- idx_found_items_status on found_items(status)
- idx_found_items_date on found_items(date_found)
- idx_found_items_user on found_items(user_id)
- idx_found_items_category on found_items(category_id)
- idx_found_items_location on found_items(location_id)
- idx_claims_status on claims(status)
- idx_claims_lost_item on claims(lost_item_id)
- idx_claims_found_item on claims(found_item_id)
- idx_claims_claimant on claims(claimant_id)
- idx_item_images_lost on item_images(lost_item_id)
- idx_item_images_found on item_images(found_item_id)
- idx_notifications_user on notifications(user_id, is_read)
- idx_notifications_read on notifications(is_read)

## Triggers

### Update Timestamp Triggers
- trg_users_update - Update updated_at on users
- trg_lost_items_update - Update updated_at on lost_items
- trg_found_items_update - Update updated_at on found_items
- trg_claims_update - Update updated_at on claims

Note: PostgreSQL uses SERIAL for auto-increment, so explicit sequence triggers are not needed.

## Constraints

### Foreign Keys
- fk_lost_items_user (lost_items.user_id -> users.user_id)
- fk_lost_items_category (lost_items.category_id -> categories.category_id)
- fk_lost_items_location (lost_items.location_id -> locations.location_id)
- fk_found_items_user (found_items.user_id -> users.user_id)
- fk_found_items_category (found_items.category_id -> categories.category_id)
- fk_found_items_location (found_items.location_id -> locations.location_id)
- fk_item_images_lost (item_images.lost_item_id -> lost_items.lost_item_id)
- fk_item_images_found (item_images.found_item_id -> found_items.found_item_id)
- fk_claims_lost (claims.lost_item_id -> lost_items.lost_item_id)
- fk_claims_found (claims.found_item_id -> found_items.found_item_id)
- fk_claims_claimant (claims.claimant_id -> users.user_id)
- fk_claims_verifier (claims.verified_by -> users.user_id)
- fk_notifications_user (notifications.user_id -> users.user_id)

### Check Constraints
- chk_users_role - Role in ('STUDENT', 'STAFF', 'ADMIN')
- chk_lost_items_status - Status in ('OPEN', 'MATCHED', 'CLAIMED', 'CLOSED')
- chk_found_items_status - Status in ('AVAILABLE', 'CLAIMED', 'RETURNED', 'DISPOSED')
- chk_claims_status - Status in ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')
- chk_item_images_item_ref - Either lost_item_id or found_item_id must be set
