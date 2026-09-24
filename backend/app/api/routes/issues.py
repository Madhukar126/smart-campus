from datetime import datetime, timezone
import math
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, OptionalCurrentUser, RequireAdminOrAO
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.category import Category
from app.models.comment import Comment
from app.models.issue import ImageType, Issue, IssuePriority, IssueStatus
from app.models.issue_image import IssueImage
from app.models.issue_support import IssueSupport
from app.models.issue_update import IssueUpdate
from app.models.location import Location
from app.models.user import User, UserRole
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.schemas.issue import (
    AssignIssueRequest,
    IssueCreate,
    IssueDetailResponse,
    IssueListResponse,
    IssueSummaryResponse,
    RejectIssueRequest,
    ResolveIssueRequest,
    SetPriorityRequest,
    SimilarIssueResponse,
    StatusUpdateRequest,
    VerifyIssueRequest,
)
from app.services.audit import log_audit
from app.services.notification import create_notification
from app.services.storage import get_storage_service
from app.services.workflow import change_issue_status, is_issue_overdue

router = APIRouter(prefix="/issues", tags=["issues"])


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
        status=IssueStatus(issue.status),
        priority=IssuePriority(issue.priority),
        is_overdue=is_issue_overdue(issue),
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        resolved_at=issue.resolved_at,
        report_image_url=report_img,
        support_count=support_cnt,
        user_has_supported=user_supported,
    )


def _build_detail_response(issue: Issue, current_user_id: uuid.UUID | None) -> IssueDetailResponse:
    support_cnt = len(issue.supports)
    user_supported = False
    if current_user_id:
        user_supported = any(s.user_id == current_user_id for s in issue.supports)

    return IssueDetailResponse(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        category_id=issue.category_id,
        location_id=issue.location_id,
        category=issue.category,
        location=issue.location,
        reporter=issue.reporter,
        status=IssueStatus(issue.status),
        priority=IssuePriority(issue.priority),
        is_overdue=is_issue_overdue(issue),
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        resolved_at=issue.resolved_at,
        images=issue.images,
        assignments=issue.assignments,
        updates=issue.updates,
        comments=issue.comments,
        support_count=support_cnt,
        user_has_supported=user_supported,
    )


@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
) -> dict[str, str]:
    storage = get_storage_service()
    url = storage.save_image(file)
    return {"url": url}


@router.get("/similar", response_model=list[SimilarIssueResponse])
def get_similar_issues(
    db: Annotated[Session, Depends(get_db)],
    category_id: uuid.UUID | None = Query(None),
    location_id: uuid.UUID | None = Query(None),
    q: str | None = Query(None),
) -> list[SimilarIssueResponse]:
    # Look for active, unresolved issues in same category or location
    stmt = (
        select(Issue)
        .where(
            Issue.status.notin_([IssueStatus.RESOLVED.value, IssueStatus.REJECTED.value])
        )
    )

    conditions = []
    if category_id:
        conditions.append(Issue.category_id == category_id)
    if location_id:
        conditions.append(Issue.location_id == location_id)
    if q and len(q.strip()) >= 3:
        search_term = f"%{q.strip().lower()}%"
        conditions.append(func.lower(Issue.title).like(search_term))

    if conditions:
        stmt = stmt.where(or_(*conditions))

    stmt = stmt.order_by(desc(Issue.created_at)).limit(5)
    issues = list(db.scalars(stmt).all())

    results = []
    for iss in issues:
        results.append(
            SimilarIssueResponse(
                id=iss.id,
                title=iss.title,
                description=iss.description,
                status=IssueStatus(iss.status),
                priority=IssuePriority(iss.priority),
                category_id=iss.category_id,
                location_id=iss.location_id,
                category_name=iss.category.name if iss.category else "",
                location_name=iss.location.name if iss.location else "",
                created_at=iss.created_at,
                support_count=len(iss.supports),
            )
        )
    return results


@router.get("/my", response_model=list[IssueSummaryResponse])
def get_my_issues(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[IssueSummaryResponse]:
    stmt = select(Issue).where(Issue.reported_by == current_user.id).order_by(desc(Issue.created_at))
    issues = list(db.scalars(stmt).all())
    return [_build_summary_response(iss, current_user.id) for iss in issues]


@router.get("", response_model=IssueListResponse)
def list_issues(
    db: Annotated[Session, Depends(get_db)],
    current_user: OptionalCurrentUser = None,
    status_filter: IssueStatus | None = Query(None, alias="status"),
    category_id: uuid.UUID | None = Query(None),
    location_id: uuid.UUID | None = Query(None),
    priority: IssuePriority | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("newest", pattern="^(newest|oldest|most_supported)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
) -> IssueListResponse:
    stmt = select(Issue)

    if status_filter:
        stmt = stmt.where(Issue.status == status_filter.value)
    if category_id:
        stmt = stmt.where(Issue.category_id == category_id)
    if location_id:
        stmt = stmt.where(Issue.location_id == location_id)
    if priority:
        stmt = stmt.where(Issue.priority == priority.value)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Issue.title).like(term),
                func.lower(Issue.description).like(term),
            )
        )

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    # Sort
    if sort_by == "oldest":
        stmt = stmt.order_by(Issue.created_at.asc())
    elif sort_by == "most_supported":
        support_subquery = (
            select(IssueSupport.issue_id, func.count(IssueSupport.id).label("cnt"))
            .group_by(IssueSupport.issue_id)
            .subquery()
        )
        stmt = (
            stmt.outerjoin(support_subquery, Issue.id == support_subquery.c.issue_id)
            .order_by(desc(func.coalesce(support_subquery.c.cnt, 0)), desc(Issue.created_at))
        )
    else:
        stmt = stmt.order_by(desc(Issue.created_at))

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    issues = list(db.scalars(stmt).all())

    user_id = current_user.id if current_user else None
    items = [_build_summary_response(iss, user_id) for iss in issues]
    pages = math.ceil(total / page_size) if total > 0 else 1

    return IssueListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("", response_model=IssueDetailResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
    payload: IssueCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> IssueDetailResponse:
    # Validate category exists and is active
    category = db.get(Category, payload.category_id)
    if not category or not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category is invalid or inactive",
        )

    # Validate location exists and is active
    loc = db.get(Location, payload.location_id)
    if not loc or not loc.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campus location is invalid or inactive",
        )

    # Initial priority is default LOW (normal users cannot set priority)
    issue = Issue(
        reported_by=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        category_id=payload.category_id,
        location_id=payload.location_id,
        status=IssueStatus.OPEN.value,
        priority=IssuePriority.LOW.value,
    )
    db.add(issue)
    db.flush()

    # If image URL provided, attach report image
    if payload.image_url:
        issue_image = IssueImage(
            issue_id=issue.id,
            image_url=payload.image_url.strip(),
            image_type=ImageType.REPORT.value,
            uploaded_by=current_user.id,
        )
        db.add(issue_image)

    # Create initial IssueUpdate
    init_update = IssueUpdate(
        issue_id=issue.id,
        user_id=current_user.id,
        old_status=None,
        new_status=IssueStatus.OPEN.value,
        message="Issue reported",
    )
    db.add(init_update)

    # Create AuditLog
    log_audit(
        db=db,
        action="CREATE_ISSUE",
        entity_type="ISSUE",
        user_id=current_user.id,
        entity_id=issue.id,
        details={"title": issue.title, "category": category.name, "location": loc.name},
    )

    # Create Notification for reporter
    create_notification(
        db=db,
        user_id=current_user.id,
        issue_id=issue.id,
        title="Issue Submitted",
        message=f"Your issue '{issue.title}' has been successfully submitted and is under review.",
    )

    db.commit()
    db.refresh(issue)
    return _build_detail_response(issue, current_user.id)


@router.get("/{issue_id}", response_model=IssueDetailResponse)
def get_issue(
    issue_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: OptionalCurrentUser = None,
) -> IssueDetailResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    user_id = current_user.id if current_user else None
    return _build_detail_response(issue, user_id)


@router.post("/{issue_id}/images", response_model=IssueDetailResponse)
def add_issue_image(
    issue_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    image_url: str = Query(..., min_length=5),
    image_type: ImageType = Query(ImageType.REPORT),
) -> IssueDetailResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    image = IssueImage(
        issue_id=issue.id,
        image_url=image_url.strip(),
        image_type=image_type.value,
        uploaded_by=current_user.id,
    )
    db.add(image)
    db.commit()
    db.refresh(issue)
    return _build_detail_response(issue, current_user.id)


# Workflow Endpoints
@router.post("/{issue_id}/verify", response_model=IssueDetailResponse)
def verify_issue(
    issue_id: uuid.UUID,
    payload: VerifyIssueRequest,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> IssueDetailResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    msg = payload.message or "Issue verified by administrative team"
    change_issue_status(db, issue, IssueStatus.VERIFIED, current_user, msg)
    db.commit()
    db.refresh(issue)
    return _build_detail_response(issue, current_user.id)


@router.post("/{issue_id}/reject", response_model=IssueDetailResponse)
def reject_issue(
    issue_id: uuid.UUID,
    payload: RejectIssueRequest,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> IssueDetailResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    change_issue_status(db, issue, IssueStatus.REJECTED, current_user, payload.reason)
    db.commit()
    db.refresh(issue)
    return _build_detail_response(issue, current_user.id)


@router.post("/{issue_id}/priority", response_model=IssueDetailResponse)
def set_issue_priority(
    issue_id: uuid.UUID,
    payload: SetPriorityRequest,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> IssueDetailResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    old_priority = issue.priority
    issue.priority = payload.priority.value
    issue.updated_at = datetime.now(timezone.utc)

    # Record IssueUpdate
    update_rec = IssueUpdate(
        issue_id=issue.id,
        user_id=current_user.id,
        old_status=issue.status,
        new_status=issue.status,
        message=f"Priority updated from {old_priority} to {payload.priority.value}",
    )
    db.add(update_rec)

    log_audit(
        db=db,
        action="UPDATE_PRIORITY",
        entity_type="ISSUE",
        user_id=current_user.id,
        entity_id=issue.id,
        details={"old_priority": old_priority, "new_priority": payload.priority.value},
    )

    if issue.reported_by != current_user.id:
        create_notification(
            db=db,
            user_id=issue.reported_by,
            issue_id=issue.id,
            title="Issue Priority Updated",
            message=f"Priority for '{issue.title}' was set to {payload.priority.value}",
        )

    db.commit()
    db.refresh(issue)
    return _build_detail_response(issue, current_user.id)


@router.post("/{issue_id}/assign", response_model=IssueDetailResponse)
def assign_issue(
    issue_id: uuid.UUID,
    payload: AssignIssueRequest,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> IssueDetailResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    # Verify assignee is maintenance
    assignee = db.get(User, payload.assigned_to)
    if not assignee or assignee.role != UserRole.MAINTENANCE.value or not assignee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user must be an active MAINTENANCE staff member",
        )

    # Deactivate existing active assignments
    for a in issue.assignments:
        if a.status == "ACTIVE":
            a.status = "REASSIGNED"

    assignment = Assignment(
        issue_id=issue.id,
        assigned_to=assignee.id,
        assigned_by=current_user.id,
        status="ACTIVE",
    )
    db.add(assignment)

    msg = payload.message or f"Assigned to maintenance technician {assignee.name}"
    change_issue_status(db, issue, IssueStatus.ASSIGNED, current_user, msg)

    # Notify assignee
    create_notification(
        db=db,
        user_id=assignee.id,
        issue_id=issue.id,
        title="New Issue Assigned",
        message=f"You have been assigned to issue '{issue.title}' at {issue.location.name}",
    )

    db.commit()
    db.refresh(issue)
    return _build_detail_response(issue, current_user.id)


@router.post("/{issue_id}/status", response_model=IssueDetailResponse)
def update_issue_status(
    issue_id: uuid.UUID,
    payload: StatusUpdateRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> IssueDetailResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    change_issue_status(db, issue, payload.status, current_user, payload.message)
    db.commit()
    db.refresh(issue)
    return _build_detail_response(issue, current_user.id)


@router.post("/{issue_id}/resolve", response_model=IssueDetailResponse)
def resolve_issue(
    issue_id: uuid.UUID,
    payload: ResolveIssueRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> IssueDetailResponse:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    change_issue_status(db, issue, IssueStatus.RESOLVED, current_user, payload.resolution_note)

    if payload.image_url:
        img = IssueImage(
            issue_id=issue.id,
            image_url=payload.image_url.strip(),
            image_type=ImageType.RESOLUTION.value,
            uploaded_by=current_user.id,
        )
        db.add(img)

    db.commit()
    db.refresh(issue)
    return _build_detail_response(issue, current_user.id)


# Comments & Community Support
@router.post("/{issue_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    issue_id: uuid.UUID,
    payload: CommentCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Comment:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    comment = Comment(
        issue_id=issue.id,
        user_id=current_user.id,
        comment=payload.comment.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    log_audit(
        db=db,
        action="ADD_COMMENT",
        entity_type="ISSUE",
        user_id=current_user.id,
        entity_id=issue.id,
        details={"comment_id": str(comment.id)},
    )

    if issue.reported_by != current_user.id:
        create_notification(
            db=db,
            user_id=issue.reported_by,
            issue_id=issue.id,
            title="New Comment on Your Issue",
            message=f"{current_user.name} commented on '{issue.title}'",
        )

    db.commit()
    return comment


@router.patch("/{issue_id}/comments/{comment_id}", response_model=CommentResponse)
def edit_comment(
    issue_id: uuid.UUID,
    comment_id: uuid.UUID,
    payload: CommentUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Comment:
    comment = db.get(Comment, comment_id)
    if not comment or comment.issue_id != issue_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments",
        )

    comment.comment = payload.comment.strip()
    comment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{issue_id}/comments/{comment_id}")
def delete_comment(
    issue_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    comment = db.get(Comment, comment_id)
    if not comment or comment.issue_id != issue_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    is_author = comment.user_id == current_user.id
    is_admin = current_user.role in (UserRole.ADMIN.value, UserRole.AO.value)

    if not is_author and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this comment",
        )

    action = "DELETE_OWN_COMMENT" if is_author else "MODERATE_COMMENT"
    log_audit(
        db=db,
        action=action,
        entity_type="COMMENT",
        user_id=current_user.id,
        entity_id=comment.id,
        details={"author_id": str(comment.user_id), "issue_id": str(issue_id)},
    )

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}


@router.post("/{issue_id}/support")
def support_issue(
    issue_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, int]:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    existing = db.scalar(
        select(IssueSupport).where(
            IssueSupport.issue_id == issue_id,
            IssueSupport.user_id == current_user.id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already supported this issue",
        )

    support = IssueSupport(issue_id=issue_id, user_id=current_user.id)
    db.add(support)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already supported this issue",
        ) from exc

    cnt = db.scalar(select(func.count(IssueSupport.id)).where(IssueSupport.issue_id == issue_id)) or 0
    return {"support_count": cnt}


@router.delete("/{issue_id}/support")
def remove_support(
    issue_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, int]:
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    support = db.scalar(
        select(IssueSupport).where(
            IssueSupport.issue_id == issue_id,
            IssueSupport.user_id == current_user.id,
        )
    )
    if support:
        db.delete(support)
        db.commit()

    cnt = db.scalar(select(func.count(IssueSupport.id)).where(IssueSupport.issue_id == issue_id)) or 0
    return {"support_count": cnt}
