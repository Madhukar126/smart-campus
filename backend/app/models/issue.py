import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IssueStatus(str, enum.Enum):
    OPEN = "OPEN"
    VERIFIED = "VERIFIED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class IssuePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ImageType(str, enum.Enum):
    REPORT = "REPORT"
    RESOLUTION = "RESOLUTION"


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    reported_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"), index=True, nullable=False)
    location_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("locations.id"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default=IssueStatus.OPEN.value, index=True)
    priority: Mapped[str] = mapped_column(String(32), default=IssuePriority.LOW.value, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    reporter = relationship("User", foreign_keys=[reported_by], lazy="joined")
    category = relationship("Category", foreign_keys=[category_id], lazy="joined")
    location = relationship("Location", foreign_keys=[location_id], lazy="joined")
    images = relationship("IssueImage", back_populates="issue", cascade="all, delete-orphan", order_by="IssueImage.created_at")
    assignments = relationship("Assignment", back_populates="issue", cascade="all, delete-orphan", order_by="desc(Assignment.assigned_at)")
    updates = relationship("IssueUpdate", back_populates="issue", cascade="all, delete-orphan", order_by="IssueUpdate.created_at")
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan", order_by="Comment.created_at")
    supports = relationship("IssueSupport", back_populates="issue", cascade="all, delete-orphan")
