from datetime import datetime, timezone, timedelta
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.assignment import Assignment
from app.models.issue import Issue, IssuePriority, IssueStatus
from app.models.issue_update import IssueUpdate
from app.models.user import User, UserRole
from app.services.audit import log_audit
from app.services.notification import create_notification


def get_overdue_threshold_hours(priority: str) -> int:
    if priority == IssuePriority.CRITICAL.value:
        return settings.overdue_hours_critical
    elif priority == IssuePriority.HIGH.value:
        return settings.overdue_hours_high
    elif priority == IssuePriority.MEDIUM.value:
        return settings.overdue_hours_medium
    else:
        return settings.overdue_hours_low


def is_issue_overdue(issue: Issue) -> bool:
    if issue.status in (IssueStatus.RESOLVED.value, IssueStatus.REJECTED.value):
        return False
    threshold_hours = get_overdue_threshold_hours(issue.priority)
    created_at = issue.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    return (now - created_at) > timedelta(hours=threshold_hours)


def change_issue_status(
    db: Session,
    issue: Issue,
    new_status: IssueStatus,
    current_user: User,
    message: str,
) -> Issue:
    old_status = issue.status

    if old_status == new_status.value:
        return issue

    # Validate permissions & transitions
    is_admin_or_ao = current_user.role in (UserRole.ADMIN.value, UserRole.AO.value)
    is_maintenance = current_user.role == UserRole.MAINTENANCE.value

    if new_status == IssueStatus.VERIFIED:
        if not is_admin_or_ao:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only AO or ADMIN users can verify issues",
            )
        if old_status != IssueStatus.OPEN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot verify issue with status '{old_status}'",
            )

    elif new_status == IssueStatus.REJECTED:
        if not is_admin_or_ao:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only AO or ADMIN users can reject issues",
            )
        if old_status not in (IssueStatus.OPEN.value, IssueStatus.VERIFIED.value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject issue with status '{old_status}'",
            )
        if not message or not message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A rejection reason is required",
            )

    elif new_status == IssueStatus.IN_PROGRESS:
        if old_status != IssueStatus.ASSIGNED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Issue must be ASSIGNED before it can be moved to IN_PROGRESS",
            )
        if is_maintenance:
            # Check if this maintenance user is assigned
            active_assignment = next(
                (a for a in issue.assignments if a.status == "ACTIVE" and a.assigned_to == current_user.id),
                None,
            )
            if not active_assignment and not is_admin_or_ao:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not assigned to this issue",
                )
        elif not is_admin_or_ao:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to start work on this issue",
            )

    elif new_status == IssueStatus.RESOLVED:
        if old_status != IssueStatus.IN_PROGRESS.value and not is_admin_or_ao:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Issue must be IN_PROGRESS before it can be marked as RESOLVED",
            )
        if is_maintenance:
            active_assignment = next(
                (a for a in issue.assignments if a.status == "ACTIVE" and a.assigned_to == current_user.id),
                None,
            )
            if not active_assignment and not is_admin_or_ao:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not assigned to this issue",
                )
        elif not is_admin_or_ao:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to resolve this issue",
            )
        if not message or not message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A resolution note is required to resolve this issue",
            )
        issue.resolved_at = datetime.now(timezone.utc)

        # Mark active assignment completed
        for a in issue.assignments:
            if a.status == "ACTIVE":
                a.status = "COMPLETED"

    # Update issue status
    issue.status = new_status.value
    issue.updated_at = datetime.now(timezone.utc)

    # Record IssueUpdate
    update_record = IssueUpdate(
        issue_id=issue.id,
        user_id=current_user.id,
        old_status=old_status,
        new_status=new_status.value,
        message=message.strip(),
    )
    db.add(update_record)

    # Record AuditLog
    log_audit(
        db=db,
        action="STATUS_CHANGE",
        entity_type="ISSUE",
        user_id=current_user.id,
        entity_id=issue.id,
        details={
            "old_status": old_status,
            "new_status": new_status.value,
            "message": message.strip(),
        },
    )

    # Notify reporter
    if issue.reported_by != current_user.id:
        create_notification(
            db=db,
            user_id=issue.reported_by,
            issue_id=issue.id,
            title=f"Issue Status: {new_status.value}",
            message=f"Your issue '{issue.title}' has been moved to {new_status.value}: {message.strip()}",
        )

    # Notify active assignee if different from current_user
    for a in issue.assignments:
        if a.status == "ACTIVE" and a.assigned_to != current_user.id:
            create_notification(
                db=db,
                user_id=a.assigned_to,
                issue_id=issue.id,
                title=f"Assigned Issue Updated: {new_status.value}",
                message=f"Issue '{issue.title}' updated to {new_status.value}: {message.strip()}",
            )

    return issue
