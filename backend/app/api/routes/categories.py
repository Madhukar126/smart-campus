import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import RequireAdminOrAO
from app.db.session import get_db
from app.models.category import Category
from app.models.issue import Issue
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.audit import log_audit

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    db: Annotated[Session, Depends(get_db)],
    all: bool = Query(False, description="Include inactive categories if True"),
) -> list[Category]:
    stmt = select(Category)
    if not all:
        stmt = stmt.where(Category.is_active == True)  # noqa: E712
    stmt = stmt.order_by(Category.name.asc())
    return list(db.scalars(stmt).all())


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> Category:
    name_clean = payload.name.strip().upper()
    existing = db.scalar(select(Category).where(func.upper(Category.name) == name_clean))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category with this name already exists",
        )

    category = Category(
        name=name_clean,
        description=payload.description.strip() if payload.description else None,
        is_active=True,
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    log_audit(
        db=db,
        action="CREATE_CATEGORY",
        entity_type="CATEGORY",
        user_id=current_user.id,
        entity_id=category.id,
        details={"name": category.name},
    )
    db.commit()
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> Category:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if payload.name is not None:
        name_clean = payload.name.strip().upper()
        existing = db.scalar(
            select(Category).where(func.upper(Category.name) == name_clean, Category.id != category_id)
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category with this name already exists",
            )
        category.name = name_clean

    if payload.description is not None:
        category.description = payload.description.strip() if payload.description else None

    if payload.is_active is not None:
        category.is_active = payload.is_active

    db.commit()
    db.refresh(category)

    log_audit(
        db=db,
        action="UPDATE_CATEGORY",
        entity_type="CATEGORY",
        user_id=current_user.id,
        entity_id=category.id,
        details={"name": category.name, "is_active": category.is_active},
    )
    db.commit()
    return category


@router.delete("/{category_id}", response_model=CategoryResponse)
def deactivate_category(
    category_id: uuid.UUID,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> Category:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Check if category is referenced by any issues
    issue_count = db.scalar(select(func.count(Issue.id)).where(Issue.category_id == category_id)) or 0
    if issue_count > 0:
        # Cannot permanently delete; deactivate instead
        category.is_active = False
        db.commit()
        db.refresh(category)
        log_audit(
            db=db,
            action="DEACTIVATE_CATEGORY",
            entity_type="CATEGORY",
            user_id=current_user.id,
            entity_id=category.id,
            details={"reason": "Referenced by existing issues, deactivated instead of deleted"},
        )
        db.commit()
        return category

    # If not referenced, deactivate or remove
    category.is_active = False
    db.commit()
    db.refresh(category)
    return category
