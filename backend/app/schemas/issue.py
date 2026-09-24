import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.issue import ImageType, IssuePriority, IssueStatus
from app.schemas.category import CategoryResponse
from app.schemas.comment import CommentResponse
from app.schemas.location import LocationResponse
from app.schemas.user import UserSummary


class IssueImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    issue_id: uuid.UUID
    image_url: str
    image_type: ImageType
    uploaded_by: uuid.UUID
    uploader: UserSummary | None = None
    created_at: datetime


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    issue_id: uuid.UUID
    assigned_to: uuid.UUID
    assigned_by: uuid.UUID
    assignee: UserSummary
    assigner: UserSummary
    assigned_at: datetime
    status: str


class IssueUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    issue_id: uuid.UUID
    user_id: uuid.UUID
    user: UserSummary
    old_status: str | None
    new_status: str
    message: str
    created_at: datetime


class IssueCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    category_id: uuid.UUID
    location_id: uuid.UUID
    image_url: str | None = None


class IssueSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    category_id: uuid.UUID
    location_id: uuid.UUID
    category: CategoryResponse
    location: LocationResponse
    reporter: UserSummary
    status: IssueStatus
    priority: IssuePriority
    is_overdue: bool
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    report_image_url: str | None = None
    support_count: int = 0
    user_has_supported: bool = False


class IssueDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    category_id: uuid.UUID
    location_id: uuid.UUID
    category: CategoryResponse
    location: LocationResponse
    reporter: UserSummary
    status: IssueStatus
    priority: IssuePriority
    is_overdue: bool
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    images: list[IssueImageResponse] = []
    assignments: list[AssignmentResponse] = []
    updates: list[IssueUpdateResponse] = []
    comments: list[CommentResponse] = []
    support_count: int = 0
    user_has_supported: bool = False


class IssueListResponse(BaseModel):
    items: list[IssueSummaryResponse]
    total: int
    page: int
    page_size: int
    pages: int


class SimilarIssueResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    status: IssueStatus
    priority: IssuePriority
    category_id: uuid.UUID
    location_id: uuid.UUID
    category_name: str
    location_name: str
    created_at: datetime
    support_count: int


# Workflow Request Schemas
class VerifyIssueRequest(BaseModel):
    message: str | None = "Issue verified by administrative team"


class RejectIssueRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=1000)


class SetPriorityRequest(BaseModel):
    priority: IssuePriority


class AssignIssueRequest(BaseModel):
    assigned_to: uuid.UUID
    message: str | None = None


class ResolveIssueRequest(BaseModel):
    resolution_note: str = Field(..., min_length=3, max_length=2000)
    image_url: str | None = None


class StatusUpdateRequest(BaseModel):
    status: IssueStatus
    message: str = Field(..., min_length=2, max_length=1000)
