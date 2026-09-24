from datetime import datetime, timezone, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.api.dependencies import RequireAdminOrAO, RequireLeadership
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.audit_log import AuditLog
from app.models.category import Category
from app.models.issue import Issue, IssuePriority, IssueStatus
from app.models.location import Location
from app.models.user import User, UserRole
from app.schemas.analytics import (
    AnalyticsSummary,
    DateMetricCount,
    FullAnalyticsResponse,
    MaintenancePerformance,
    MetricCount,
)
from app.schemas.user import UserResponse
from app.services.workflow import is_issue_overdue

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users/maintenance", response_model=list[UserResponse])
def get_maintenance_users(
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> list[User]:
    stmt = (
        select(User)
        .where(User.role == UserRole.MAINTENANCE.value, User.is_active == True)  # noqa: E712
        .order_by(User.name.asc())
    )
    return list(db.scalars(stmt).all())


@router.get("/dashboard", response_model=dict)
def get_admin_dashboard(
    current_user: RequireLeadership,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    all_issues = list(db.scalars(select(Issue)).all())

    total = len(all_issues)
    open_cnt = sum(1 for i in all_issues if i.status == IssueStatus.OPEN.value)
    verified_cnt = sum(1 for i in all_issues if i.status == IssueStatus.VERIFIED.value)
    assigned_cnt = sum(1 for i in all_issues if i.status == IssueStatus.ASSIGNED.value)
    in_progress_cnt = sum(1 for i in all_issues if i.status == IssueStatus.IN_PROGRESS.value)
    resolved_cnt = sum(1 for i in all_issues if i.status == IssueStatus.RESOLVED.value)
    rejected_cnt = sum(1 for i in all_issues if i.status == IssueStatus.REJECTED.value)
    high_cnt = sum(1 for i in all_issues if i.priority == IssuePriority.HIGH.value and i.status not in (IssueStatus.RESOLVED.value, IssueStatus.REJECTED.value))
    critical_cnt = sum(1 for i in all_issues if i.priority == IssuePriority.CRITICAL.value and i.status not in (IssueStatus.RESOLVED.value, IssueStatus.REJECTED.value))
    overdue_cnt = sum(1 for i in all_issues if is_issue_overdue(i))

    # Overdue issues list
    overdue_issues = [
        {
            "id": str(i.id),
            "title": i.title,
            "category": i.category.name if i.category else "",
            "location": i.location.name if i.location else "",
            "priority": i.priority,
            "status": i.status,
            "created_at": i.created_at.isoformat(),
        }
        for i in all_issues
        if is_issue_overdue(i)
    ][:10]

    return {
        "summary": {
            "total_issues": total,
            "open_issues": open_cnt,
            "verified_issues": verified_cnt,
            "assigned_issues": assigned_cnt,
            "in_progress_issues": in_progress_cnt,
            "resolved_issues": resolved_cnt,
            "rejected_issues": rejected_cnt,
            "high_priority_issues": high_cnt,
            "critical_issues": critical_cnt,
            "overdue_issues": overdue_cnt,
        },
        "overdue_issues": overdue_issues,
    }


@router.get("/analytics", response_model=FullAnalyticsResponse)
def get_analytics(
    current_user: RequireLeadership,
    db: Annotated[Session, Depends(get_db)],
) -> FullAnalyticsResponse:
    all_issues = list(db.scalars(select(Issue)).all())

    total = len(all_issues)
    open_cnt = sum(1 for i in all_issues if i.status == IssueStatus.OPEN.value)
    verified_cnt = sum(1 for i in all_issues if i.status == IssueStatus.VERIFIED.value)
    assigned_cnt = sum(1 for i in all_issues if i.status == IssueStatus.ASSIGNED.value)
    in_progress_cnt = sum(1 for i in all_issues if i.status == IssueStatus.IN_PROGRESS.value)
    resolved_cnt = sum(1 for i in all_issues if i.status == IssueStatus.RESOLVED.value)
    rejected_cnt = sum(1 for i in all_issues if i.status == IssueStatus.REJECTED.value)
    high_cnt = sum(1 for i in all_issues if i.priority == IssuePriority.HIGH.value and i.status not in (IssueStatus.RESOLVED.value, IssueStatus.REJECTED.value))
    critical_cnt = sum(1 for i in all_issues if i.priority == IssuePriority.CRITICAL.value and i.status not in (IssueStatus.RESOLVED.value, IssueStatus.REJECTED.value))
    overdue_cnt = sum(1 for i in all_issues if is_issue_overdue(i))

    # Average resolution time
    resolved_issues = [i for i in all_issues if i.status == IssueStatus.RESOLVED.value and i.resolved_at is not None]
    if resolved_issues:
        total_seconds = sum(
            (i.resolved_at - (i.created_at if i.created_at.tzinfo else i.created_at.replace(tzinfo=timezone.utc))).total_seconds()
            for i in resolved_issues
        )
        avg_resolution_hours = round(max(0.0, total_seconds / (3600 * len(resolved_issues))), 1)
    else:
        avg_resolution_hours = 0.0

    summary = AnalyticsSummary(
        total_issues=total,
        open_issues=open_cnt,
        verified_issues=verified_cnt,
        assigned_issues=assigned_cnt,
        in_progress_issues=in_progress_cnt,
        resolved_issues=resolved_cnt,
        rejected_issues=rejected_cnt,
        high_priority_issues=high_cnt,
        critical_issues=critical_cnt,
        overdue_issues=overdue_cnt,
        avg_resolution_hours=avg_resolution_hours,
    )

    # By status
    status_counts: dict[str, int] = {}
    for st in IssueStatus:
        status_counts[st.value] = sum(1 for i in all_issues if i.status == st.value)
    by_status = [MetricCount(name=k, count=v) for k, v in status_counts.items()]

    # By category
    cat_stmt = (
        select(Category.name, func.count(Issue.id))
        .join(Issue, Issue.category_id == Category.id)
        .group_by(Category.name)
        .order_by(desc(func.count(Issue.id)))
    )
    by_category = [MetricCount(name=r[0], count=r[1]) for r in db.execute(cat_stmt).all()]

    # By location
    loc_stmt = (
        select(Location.name, func.count(Issue.id))
        .join(Issue, Issue.location_id == Location.id)
        .group_by(Location.name)
        .order_by(desc(func.count(Issue.id)))
    )
    by_location = [MetricCount(name=r[0], count=r[1]) for r in db.execute(loc_stmt).all()]

    # By priority
    priority_counts: dict[str, int] = {}
    for p in IssuePriority:
        priority_counts[p.value] = sum(1 for i in all_issues if i.priority == p.value)
    by_priority = [MetricCount(name=k, count=v) for k, v in priority_counts.items()]

    # Reports over time (last 14 days)
    now = datetime.now(timezone.utc)
    dates_map: dict[str, int] = {}
    for day_offset in range(13, -1, -1):
        d_str = (now - timedelta(days=day_offset)).strftime("%Y-%m-%d")
        dates_map[d_str] = 0

    for i in all_issues:
        d_str = i.created_at.strftime("%Y-%m-%d")
        if d_str in dates_map:
            dates_map[d_str] += 1
    reports_over_time = [DateMetricCount(date=k, count=v) for k, v in dates_map.items()]

    # Resolved vs Unresolved
    resolved_vs_unresolved = [
        MetricCount(name="Resolved", count=resolved_cnt),
        MetricCount(name="Unresolved", count=total - resolved_cnt - rejected_cnt),
        MetricCount(name="Rejected", count=rejected_cnt),
    ]

    # Maintenance Performance
    maintenance_users = list(
        db.scalars(
            select(User).where(User.role == UserRole.MAINTENANCE.value, User.is_active == True)  # noqa: E712
        ).all()
    )
    all_assignments = list(db.scalars(select(Assignment)).all())

    maintenance_performance = []
    for m in maintenance_users:
        user_assignments = [a for a in all_assignments if a.assigned_to == m.id]
        completed = sum(1 for a in user_assignments if a.status == "COMPLETED")
        active = sum(1 for a in user_assignments if a.status == "ACTIVE")
        maintenance_performance.append(
            MaintenancePerformance(
                maintenance_id=str(m.id),
                maintenance_name=m.name,
                completed_count=completed,
                active_count=active,
            )
        )

    return FullAnalyticsResponse(
        summary=summary,
        by_status=by_status,
        by_category=by_category,
        by_location=by_location,
        by_priority=by_priority,
        reports_over_time=reports_over_time,
        resolved_vs_unresolved=resolved_vs_unresolved,
        maintenance_performance=maintenance_performance,
    )


@router.get("/audit-logs", response_model=dict)
def get_audit_logs(
    current_user: RequireLeadership,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at))
    total = db.scalar(select(func.count(AuditLog.id))) or 0

    offset = (page - 1) * page_size
    items = list(db.scalars(stmt.offset(offset).limit(page_size)).all())

    logs_data = []
    for l in items:
        logs_data.append(
            {
                "id": str(l.id),
                "action": l.action,
                "entity_type": l.entity_type,
                "entity_id": str(l.entity_id) if l.entity_id else None,
                "user_name": l.user.name if l.user else "System",
                "details": l.details,
                "created_at": l.created_at.isoformat(),
            }
        )

    return {"items": logs_data, "total": total, "page": page, "page_size": page_size}
