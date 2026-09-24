# Run Campus360 without Docker

Campus360 can run locally with SQLite, so Docker and PostgreSQL are optional during development.

## Requirements

- Windows PowerShell 7 or Windows PowerShell 5.1
- Python 3.12 or newer
- Node.js 20 or newer
- npm

## First-time setup

Open PowerShell in the project directory and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-local.ps1
```

The setup script creates `backend/.venv`, installs dependencies, creates `backend/campus360_local.db`, and applies the Alembic migration.

## Start the application

```powershell
.\scripts\start-local.ps1
```

Open:

- Web application: http://localhost:3000
- API documentation: http://localhost:8000/docs
- API health check: http://localhost:8000/api/v1/health

Runtime logs are stored in `.local-runtime/`.

## Stop the application

```powershell
.\scripts\stop-local.ps1
```

## Reset local data

Stop the application, delete `backend/campus360_local.db`, and run the setup script again. The database file is ignored by Git.

## PostgreSQL later

SQLite is intended for easy local development and demonstrations. PostgreSQL remains the recommended production database. Switching back requires only a PostgreSQL `DATABASE_URL`; the application models and Alembic migrations remain the same.

