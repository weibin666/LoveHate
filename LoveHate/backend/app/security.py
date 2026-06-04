from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import settings

security = HTTPBearer()

RATE_LIMIT_STORE: dict = {}


async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/auth/sms"):
        client_ip = request.client.host if request.client else "unknown"
        key = f"sms:{client_ip}"
        now = datetime.now(timezone.utc)

        if key in RATE_LIMIT_STORE:
            last_time, count = RATE_LIMIT_STORE[key]
            if (now - last_time) < timedelta(minutes=1):
                if count >= 5:
                    raise HTTPException(status_code=429, detail="Too many requests")
                RATE_LIMIT_STORE[key] = (last_time, count + 1)
            else:
                RATE_LIMIT_STORE[key] = (now, 1)
        else:
            RATE_LIMIT_STORE[key] = (now, 1)

    response = await call_next(request)
    return response


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    return jwt.encode({"sub": user_id, "type": "refresh", "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload.get("sub")
    except JWTError:
        return None
