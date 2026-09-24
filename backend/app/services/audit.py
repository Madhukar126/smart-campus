import json
import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    user_id: uuid.UUID | None = None,
    entity_id: uuid.UUID | None = None,
    details: Any = None,
) -> AuditLog:
    serialized_details: str | None = None
    if details is not None:
        if isinstance(details, (dict, list)):
            serialized_details = json.dumps(details)
        else:
            serialized_details = str(details)

    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=serialized_details,
    )
    db.add(log_entry)
    return log_entry
