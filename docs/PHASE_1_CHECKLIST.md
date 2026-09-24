# Phase 1 checklist

- [x] Create clean frontend/backend project structure.
- [x] Document architecture, schema, and endpoint plan.
- [x] Configure PostgreSQL through environment variables.
- [x] Add SQLAlchemy user model and Alembic migration.
- [x] Add registration with validation and duplicate-email handling.
- [x] Add password hashing and JWT login.
- [x] Add protected current-user endpoint and role-ready dependency.
- [x] Add backend tests for health, registration, login, and invalid login.
- [x] Add Next.js landing, login, registration, and protected dashboard pages.
- [x] Add Docker Compose for PostgreSQL, backend, and frontend.
- [x] Validate the Docker Compose configuration.
- [x] Pass frontend lint and production build.
- [x] Pass backend tests and migration verification.
- [x] Complete a local HTTP smoke test across frontend and backend.
- [ ] Run the complete Docker stack on a machine with Docker Desktop running.

Phase 1 acceptance: the health endpoint reports database connectivity; a user can register, log in, open the protected dashboard, refresh their identity, and log out.
