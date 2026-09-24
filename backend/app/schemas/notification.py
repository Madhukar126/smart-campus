import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    issue_id: uuid.UUID | None
    title: str
    message: str
    is_read: bool
    created_at: datetime
