from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import os
import shutil
from pathlib import Path

from app.core.config import settings

db_url = settings.database_url

# In Vercel serverless environment, local directory is read-only.
# Copy seeded sqlite database to /tmp if using sqlite.
if os.environ.get("VERCEL") and db_url.startswith("sqlite"):
    tmp_db = Path("/tmp/campus360.db")
    if not tmp_db.exists():
        src_db = Path(__file__).resolve().parent.parent.parent / "campus360.db"
        if src_db.exists():
            shutil.copyfile(src_db, tmp_db)
    db_url = f"sqlite:///{tmp_db}"

engine_options: dict[str, object] = {"pool_pre_ping": True}
if db_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(db_url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

