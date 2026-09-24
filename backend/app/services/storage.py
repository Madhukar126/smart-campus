import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class BaseStorageService(ABC):
    @abstractmethod
    def save_image(self, file: UploadFile) -> str:
        """Saves an uploaded image and returns its accessible URL or path."""
        pass


class LocalStorageService(BaseStorageService):
    def __init__(self, upload_dir: str | Path | None = None):
        if upload_dir is None:
            backend_dir = Path(__file__).resolve().parent.parent.parent
            self.upload_dir = backend_dir / "uploads"
        else:
            self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_image(self, file: UploadFile) -> str:
        if not file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported content type '{file.content_type}'. Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
            )

        contents = file.file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed limit of 5MB",
            )
        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File cannot be empty",
            )

        safe_filename = f"{uuid.uuid4().hex}{ext}"
        destination = self.upload_dir / safe_filename
        with open(destination, "wb") as f:
            f.write(contents)

        return f"/uploads/{safe_filename}"


# Storage service singleton (can be swapped for CloudinaryStorageService later)
storage_service = LocalStorageService()


def get_storage_service() -> BaseStorageService:
    return storage_service
