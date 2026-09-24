import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import RequireAdminOrAO
from app.db.session import get_db
from app.models.issue import Issue
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate
from app.services.audit import log_audit

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationResponse])
def list_locations(
    db: Annotated[Session, Depends(get_db)],
    all: bool = Query(False, description="Include inactive locations if True"),
) -> list[Location]:
    stmt = select(Location)
    if not all:
        stmt = stmt.where(Location.is_active == True)  # noqa: E712
    stmt = stmt.order_by(Location.name.asc())
    return list(db.scalars(stmt).all())


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    payload: LocationCreate,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> Location:
    name_clean = payload.name.strip()
    existing = db.scalar(select(Location).where(func.lower(Location.name) == name_clean.lower()))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Location with this name already exists",
        )

    location = Location(
        name=name_clean,
        description=payload.description.strip() if payload.description else None,
        is_active=True,
    )
    db.add(location)
    db.commit()
    db.refresh(location)

    log_audit(
        db=db,
        action="CREATE_LOCATION",
        entity_type="LOCATION",
        user_id=current_user.id,
        entity_id=location.id,
        details={"name": location.name},
    )
    db.commit()
    return location


@router.patch("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: uuid.UUID,
    payload: LocationUpdate,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> Location:
    location = db.get(Location, location_id)
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    if payload.name is not None:
        name_clean = payload.name.strip()
        existing = db.scalar(
            select(Location).where(func.lower(Location.name) == name_clean.lower(), Location.id != location_id)
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Location with this name already exists",
            )
        location.name = name_clean

    if payload.description is not None:
        location.description = payload.description.strip() if payload.description else None

    if payload.is_active is not None:
        location.is_active = payload.is_active

    db.commit()
    db.refresh(location)

    log_audit(
        db=db,
        action="UPDATE_LOCATION",
        entity_type="LOCATION",
        user_id=current_user.id,
        entity_id=location.id,
        details={"name": location.name, "is_active": location.is_active},
    )
    db.commit()
    return location


@router.delete("/{location_id}", response_model=LocationResponse)
def deactivate_location(
    location_id: uuid.UUID,
    current_user: RequireAdminOrAO,
    db: Annotated[Session, Depends(get_db)],
) -> Location:
    location = db.get(Location, location_id)
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    issue_count = db.scalar(select(func.count(Issue.id)).where(Issue.location_id == location_id)) or 0
    if issue_count > 0:
        location.is_active = False
        db.commit()
        db.refresh(location)
        log_audit(
            db=db,
            action="DEACTIVATE_LOCATION",
            entity_type="LOCATION",
            user_id=current_user.id,
            entity_id=location.id,
            details={"reason": "Referenced by existing issues, deactivated instead of deleted"},
        )
        db.commit()
        return location

    location.is_active = False
    db.commit()
    db.refresh(location)
    return location
