from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.dependencies import RequireMaintenance
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.issue import ImageType, Issue, IssueStatus
from app.models.issue_image import IssueImage
from app.schemas.issue import IssueDetailResponse, IssueSummaryResponse, ResolveIssueRequest
from app.services.workflow import change_issue_status, is_issue_overdue

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


def _build_summary_response(issue: Issue, current_user_id: uuid.UUID | None) -> IssueSummaryResponse:
    report_img = next((img.image_url for img in issue.images if img.image_type == ImageType.REPORT.value), None)
    if not report_img and issue.images:
        report_img = issue.images[0].image_url

    support_cnt = len(issue.supports)
    user_supported = False
    if current_user_id:
        user_supported = any(s.user_id == current_user_id for s in issue.supports)

    return IssueSummaryResponse(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        category_id=issue.category_id,
        location_id=issue.location_id,
        category=issue.category,
        location=issue.location,
        reporter=issue.reporter,
        status=issue.status,
        priority=issue.priority,
        is_overdue=is_issue_overdue(issue),
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        resolved_at=issue.resolved_at,
        report_image_url=report_img,
        support_count=support_cnt,
        user_has_supported=user_supported,
    )


@router.get("/assigned", response_model=list[IssueSummaryResponse])
def get_assigned_issues(
    current_user: RequireMaintenance,
    db: Annotated[Session, Depends(get_db)],
) -> list[IssueSummaryResponse]:
    # Find active assignments for current user
    stmt = (
        select(Issue)
        .join(Assignment, Assignment.issue_id == Issue.id)
        .where(
            Assignment.assigned_to == current_user.id,
            Assignment.status.in_(["ACTIVE", "COMPLETED"]),
        )
        .order_by(desc(Assignment.assigned_at))
    )
    issues = list(db.scalars(stmt).all())
    return [_build_summary_response(i, current_user.id) for i in issues]


@router.post("/{issue_id}/start-work", response_model=IssueSummaryResponse)
def start_work(
    issue_id: uuid.UUID,
    current_user: RequireMaintenance,
    db: Annotated[Session, Depends(get_db)],
) -> IssueSummaryResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    change_issue_status(
        db=db,
        issue=issue,
        new_status=IssueStatus.IN_PROGRESS,
        current_user=current_user,
        message=f"Work started by {current_user.name}",
    )
    db.commit()
    db.refresh(issue)
    return _build_summary_response(issue, current_user.id)
