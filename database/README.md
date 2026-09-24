# Campus360 Database Layer

This directory contains standalone database schemas, migrations, and seed scripts for Campus360.

---

## 📁 Directory Structure

```text
database/
├── schema.sql         # Standalone PostgreSQL / SQLite DDL schema with all tables & indexes
├── seed.sql           # Initial category and location seed records
└── README.md          # Database setup and migration documentation
```

---

## 🗄️ Relational Entities

1. **`users`**: Campus identities with Role-Based Access Control (`STUDENT`, `STAFF`, `AO`, `PRINCIPAL`, `ADMIN`, `MAINTENANCE`).
2. **`categories`**: Facility issue categories (Electrical, Plumbing, HVAC, Civil, IT, etc.).
3. **`locations`**: Physical campus blocks, floors, and specific rooms.
4. **`issues`**: Core problem tickets tracking state machine status (`OPEN` ➔ `VERIFIED` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `RESOLVED` / `REJECTED`) and priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
5. **`issue_images`**: Visual evidence attached to reports and technician resolutions.
6. **`assignments`**: Technician assignments with instructions and completion deadlines.
7. **`issue_updates`**: Immutable state-transition timeline log.
8. **`comments`**: Public student/staff discussion and private internal staff notes.
9. **`issue_supports`**: Community upvotes (+1) with unique user constraint.
10. **`notifications`**: User alerts for issue state changes.
11. **`audit_logs`**: Administrative action logs for full accountability.

---

## 🛠️ Usage

### Direct SQL Execution (PostgreSQL)
```bash
psql -U postgres -d campus360 -f database/schema.sql
psql -U postgres -d campus360 -f database/seed.sql
```

### Alembic Migrations (Recommended for FastAPI backend)
From the repository root or `backend/` directory:
```bash
cd backend
alembic upgrade head
python -m app.db.seed
```
