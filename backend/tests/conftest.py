import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///./test_campus360.db"
os.environ["JWT_SECRET"] = "test-secret-only-minimum-32-bytes-long-key-12345"

import pytest
from fastapi.testclient import TestClient

import app.models  # noqa: F401 - ensure all models register with Base.metadata
from app.db.base import Base
from app.db.session import engine
from app.main import app


@pytest.fixture(autouse=True)
def fresh_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
