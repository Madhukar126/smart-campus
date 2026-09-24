import uuid
from typing import Annotated, Sequence

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    if credentials is None:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        subject = payload.get("sub")
        if not subject:
            return None
        user_id = uuid.UUID(subject)
    except (jwt.InvalidTokenError, ValueError, TypeError):
        return None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        subject = payload.get("sub")
        if not subject:
            raise unauthorized
        user_id = uuid.UUID(subject)
    except (jwt.InvalidTokenError, ValueError, TypeError) as exc:
        raise unauthorized from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalCurrentUser = Annotated[User | None, Depends(get_optional_current_user)]


def require_roles(allowed_roles: Sequence[UserRole | str]):
    role_values = {r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles}

    def role_checker(current_user: CurrentUser) -> User:
        if current_user.role not in role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role}'",
            )
        return current_user

    return role_checker


RequireAdminOrAO = Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.AO]))]
RequireLeadership = Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.AO, UserRole.PRINCIPAL]))]
RequireMaintenance = Annotated[User, Depends(require_roles([UserRole.ADMIN, UserRole.AO, UserRole.MAINTENANCE]))]
