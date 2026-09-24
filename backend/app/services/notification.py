import uuid

from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    title: str,
    message: str,
    issue_id: uuid.UUID | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        issue_id=issue_id,
        title=title,
        message=message,
        is_read=False,
    )
    db.add(notification)
    return notification
