# Campus360 — Smart Campus Issue Reporting and Resolution System

Campus360 is a full-stack, enterprise-grade campus facility issue reporting and workflow management platform. Students and staff report physical infrastructure defects; administrative officers verify, prioritize, and assign them; maintenance technicians record progress and resolution photos; and leadership monitors empirical resolution analytics.

---

## 🏛️ System Architecture

```text
  Students / Staff / AO / Principal / Maintenance Teams
                           |
                           v
        Next.js 15 Web Application (Port 3000)
        App Router, Tailwind CSS, Recharts, Responsive UI
                           |
                  REST / JSON over HTTP
                           |
                           v
          FastAPI REST Backend (Port 8000)
     JWT Auth, RBAC, State Machine, Pydantic, SQLAlchemy 2
             /             |                \
            v              v                 v
      PostgreSQL /      Static Local      Audit &
    SQLite Database    Image Storage   Notifications
```

---

## 📂 Repository Structure

```text
smart-campus/
├── frontend/     # Next.js 15 Web Application (App Router, Tailwind CSS, Recharts)
├── backend/      # FastAPI Backend (SQLAlchemy 2, Pydantic, Alembic, JWT Auth)
├── database/     # Standalone DDL schema.sql, seed.sql, and DB documentation
├── docs/         # Specifications (Architecture, Database Schema, API Endpoints)
└── scripts/      # PowerShell helper scripts for local non-Docker development
```

---

## ✨ Features by User Role

### 👨‍🎓 Students & Faculty Staff
- **Account Registration & Login**: Fast registration with role selection.
- **Problem Reporting**: Submit issues with title, description, category, campus location, and photo evidence.
- **Duplicate Prevention**: Live duplicate issue detection that suggests similar existing unresolved issues so users can upvote existing reports instead of filing duplicates.
- **Issue Feed**: Searchable, filterable feed sorted by newest, oldest, or most supported.
- **Community Upvotes & Discussion**: Support campus issues to boost visibility; comment and discuss solutions with other campus members.
- **Personal Dashboard**: Track submitted issues and real-time status progression.
- **Notifications**: Instant notifications on triage, assignment, and resolution.

### 👔 AO (Administrative Officer) & Admin
- **Administrative Dashboard**: Real-time KPI summary (total, open, verified, assigned, in-progress, resolved, rejected, high priority, critical, and overdue).
- **Issue Verification & Rejection**: Verify genuine complaints or reject invalid ones with mandatory rationale recorded in the audit trail.
- **Priority Escalation**: Assign severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Work Assignment**: Assign maintenance technicians and provide instructions.
- **Master Data Management**: Add, update, activate, and deactivate categories and campus locations without breaking foreign key relationships.
- **Audit Logs**: Comprehensive chronological trail of administrative decisions and comment moderations.

### 🛠️ Maintenance Technicians
- **Maintenance Workbench**: View queue of assigned issues sorted by priority.
- **Work Tracking**: Acknowledge assignments and transition issues to `IN_PROGRESS`.
- **Resolution Evidence**: Mark issues as `RESOLVED` with mandatory resolution notes and completion photos.

### 🎓 Principal & Leadership
- **Executive Analytics**: Interactive Recharts visualizations powered by real database queries:
  - Resolution rate and average resolution time in hours
  - Issue distribution by status
  - Departmental category breakdown
  - Campus physical location heat breakdown
  - 14-day daily incident trend line
  - Maintenance team productivity and completion rate
  - Overdue issue tracking

---

## ⚙️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts |
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, pytest |
| **Database** | PostgreSQL (production), SQLite (zero-config local development) |
| **Security** | Argon2 password hashing, JWT bearer tokens, Role-Based Access Control |
| **File Storage** | Pluggable file storage interface (`LocalStorageService`, Cloudinary-ready) |

---

## 🚀 Quick Start (Local Development without Docker)

Campus360 is pre-configured to run directly on your host machine without requiring Docker.

### Prerequisites
- Python 3.12 or newer
- Node.js 20 or newer
- npm

### 1. Start Backend API
```powershell
cd campus360\backend
# Create and activate venv if needed
pip install -r requirements-dev.txt
alembic upgrade head
python -m app.db.seed   # Populates demo accounts, categories, locations & 30 issues
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- API Root: http://localhost:8000
- Swagger Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/v1/health

### 2. Start Frontend Web App
```powershell
cd campus360\frontend
npm install
npm run dev
# Or run production standalone server:
npm run build
node .next/standalone/server.js
```
- Web Application: http://localhost:3000

---

## 🐳 Running with Docker Compose (Optional)

If you have Docker Desktop installed and running:
```bash
cp .env.example .env
docker compose up --build
```

---

## 👥 Demo Accounts (Development Only)

All seed accounts share the default development password: **`CampusPassword123!`**

| Role | Email | Name |
|---|---|---|
| **ADMIN** | `admin@campus360.edu` | System Administrator |
| **AO** | `ao@campus360.edu` | Administrative Officer Raman |
| **PRINCIPAL** | `principal@campus360.edu` | Dr. Sarah Jenkins (Principal) |
| **MAINTENANCE** | `murugan.maint@campus360.edu` | Murugan Electrical |
| **MAINTENANCE** | `ravi.maint@campus360.edu` | Ravi Plumbing & Civils |
| **MAINTENANCE** | `david.maint@campus360.edu` | David IT Support |
| **STAFF** | `alan.staff@campus360.edu` | Prof. Alan Turing |
| **STUDENT** | `rahul.student@campus360.edu` | Rahul Sharma |
| **STUDENT** | `priya.student@campus360.edu` | Priya Patel |
| **STUDENT** | `ananya.student@campus360.edu` | Ananya Reddy |

---

## 🧪 Testing and Verification

### Backend Pytest Suite
```bash
cd backend
python -m pytest -p no:cacheprovider tests
```
*Passes 10 test suites covering registration, authentication, RBAC, category/location CRUD, issue creation, similar issues lookup, image validation, state transitions, rejection, priority changes, assignment, comments, duplicate support prevention, notifications, audit logs, and analytics.*

### Frontend Verification
```bash
cd frontend
npm run lint    # 0 errors, 0 warnings
npm run build   # Production bundle builds cleanly (17 routes)
```

---

## 📋 Documentation Directory
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design, state machine, RBAC matrix, and SLA rules.
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — Detailed table schemas, constraints, and relationships.
- [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md) — Comprehensive catalog of all REST endpoints.
- [docs/PHASE_COMPLETION_CHECKLIST.md](docs/PHASE_COMPLETION_CHECKLIST.md) — Acceptance criteria verification.
