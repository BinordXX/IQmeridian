
from secrets import compare_digest

from fastapi import Header, HTTPException, status

from app.core.config import settings


def require_internal_service_token(
    x_internal_service_token: str | None = Header(default=None),
) -> None:
    if not x_internal_service_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing internal service token.",
        )

    supplied_token = x_internal_service_token.encode("utf-8")
    expected_token = settings.internal_service_token.encode("utf-8")

    if not compare_digest(supplied_token, expected_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal service token.",
        )
