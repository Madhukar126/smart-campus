import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserSummary


class CommentCreate(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)


class CommentUpdate(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    issue_id: uuid.UUID
    user_id: uuid.UUID
    user: UserSummary
    comment: str
    created_at: datetime
    updated_at: datetime
