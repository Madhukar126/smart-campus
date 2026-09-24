# Database Schema — Campus360

Campus360 uses a normalized, relational database schema configured for PostgreSQL in production and SQLite in development.

## 1. `users`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Unique user identifier |
| `name` | VARCHAR(120) | NOT NULL | User's full display name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE, INDEX | Unique email in lowercase |
| `password_hash` | VARCHAR(255) | NOT NULL | Argon2 hash (never exposed via API) |
| `role` | VARCHAR(32) | NOT NULL | `STUDENT`, `STAFF`, `AO`, `PRINCIPAL`, `ADMIN`, `MAINTENANCE` |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Account status flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Server UTC timestamp |

## 2. `categories`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Unique category identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE, INDEX | Category name (e.g. ELECTRICAL, PLUMBING) |
| `description` | VARCHAR(255) | NULLABLE | Departmental or classification description |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Soft deletion / activation flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Server UTC timestamp |

## 3. `locations`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Unique location identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE, INDEX | Location name (e.g. Main Block, Classroom 203) |
| `description` | VARCHAR(255) | NULLABLE | Location details and building zone |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Soft deletion / activation flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Server UTC timestamp |

## 4. `issues`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Unique issue identifier |
| `reported_by` | UUID | FK -> `users.id`, INDEX | Reporter user ID |
| `title` | VARCHAR(200) | NOT NULL | Brief summary (5-200 chars) |
| `description` | TEXT | NOT NULL | Detailed problem description |
| `category_id` | UUID | FK -> `categories.id`, INDEX | Associated issue category |
| `location_id` | UUID | FK -> `locations.id`, INDEX | Campus physical location |
| `status` | VARCHAR(32) | NOT NULL, INDEX | `OPEN`, `VERIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED` |
| `priority` | VARCHAR(32) | NOT NULL, INDEX | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now(), INDEX | Submission timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |
| `resolved_at` | TIMESTAMPTZ | NULLABLE | Resolution completion timestamp |

## 5. `issue_images`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Unique image record ID |
| `issue_id` | UUID | FK -> `issues.id` (ON DELETE CASCADE), INDEX | Parent issue ID |
| `image_url` | VARCHAR(500) | NOT NULL | Local or cloud file storage path |
| `image_type` | VARCHAR(32) | NOT NULL, DEFAULT 'REPORT' | `REPORT` or `RESOLUTION` |
| `uploaded_by` | UUID | FK -> `users.id` | User who uploaded the photo |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Server UTC timestamp |

## 6. `assignments`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Unique assignment ID |
| `issue_id` | UUID | FK -> `issues.id` (ON DELETE CASCADE), INDEX | Assigned issue ID |
| `assigned_to` | UUID | FK -> `users.id` (MAINTENANCE), INDEX | Technician assigned to task |
| `assigned_by` | UUID | FK -> `users.id` (AO / ADMIN) | Officer who made assignment |
| `assigned_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Assignment timestamp |
| `status` | VARCHAR(32) | NOT NULL, DEFAULT 'ACTIVE' | `ACTIVE`, `COMPLETED`, `REASSIGNED` |

## 7. `issue_updates`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Update timeline event ID |
| `issue_id` | UUID | FK -> `issues.id` (ON DELETE CASCADE), INDEX | Issue ID |
| `user_id` | UUID | FK -> `users.id` | Actor who performed action |
| `old_status` | VARCHAR(32) | NULLABLE | Previous status |
| `new_status` | VARCHAR(32) | NOT NULL | Target status |
| `message` | TEXT | NOT NULL | Progress note or transition note |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Server UTC timestamp |

## 8. `comments`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Comment ID |
| `issue_id` | UUID | FK -> `issues.id` (ON DELETE CASCADE), INDEX | Parent issue ID |
| `user_id` | UUID | FK -> `users.id` | Comment author |
| `comment` | TEXT | NOT NULL | Comment message content |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last edit timestamp |

## 9. `issue_supports`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Unique support entry ID |
| `issue_id` | UUID | FK -> `issues.id` (ON DELETE CASCADE), INDEX | Supported issue ID |
| `user_id` | UUID | FK -> `users.id`, INDEX | Supporter user ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Support timestamp |

**Constraint**: `UNIQUE(issue_id, user_id)` prevents duplicate upvoting.

## 10. `notifications`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Notification ID |
| `user_id` | UUID | FK -> `users.id` (ON DELETE CASCADE), INDEX | Target recipient |
| `issue_id` | UUID | FK -> `issues.id` (ON DELETE CASCADE), NULLABLE, INDEX | Referenced issue |
| `title` | VARCHAR(200) | NOT NULL | Short notification title |
| `message` | TEXT | NOT NULL | Notification body |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT false, INDEX | Read status flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Server UTC timestamp |

## 11. `audit_logs`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default UUID4 | Audit record ID |
| `user_id` | UUID | FK -> `users.id`, NULLABLE, INDEX | User who performed action |
| `action` | VARCHAR(100) | NOT NULL, INDEX | e.g. `CREATE_ISSUE`, `STATUS_CHANGE` |
| `entity_type` | VARCHAR(50) | NOT NULL, INDEX | e.g. `ISSUE`, `CATEGORY`, `COMMENT` |
| `entity_id` | UUID | NULLABLE | Target entity UUID |
| `details` | TEXT | NULLABLE | JSON-encoded audit metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Server UTC timestamp |
