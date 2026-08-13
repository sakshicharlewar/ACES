from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config import settings
from database import get_db
from models import Admin, AdminRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Admin:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_token(credentials.credentials)
    admin_id: Optional[int] = payload.get("sub")
    if admin_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    result = await db.execute(select(Admin).where(Admin.id == int(admin_id), Admin.is_active == True))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found or inactive")
    return admin


async def require_super_admin(admin: Admin = Depends(get_current_admin)) -> Admin:
    if admin.role != AdminRole.super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return admin


# Token-based auth for legacy endpoints (query param)
async def get_admin_from_token_param(
    token: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Optional[Admin]:
    if not token:
        return None
    try:
        payload = decode_token(token)
        admin_id = payload.get("sub")
        if not admin_id:
            return None
        result = await db.execute(select(Admin).where(Admin.id == int(admin_id)))
        return result.scalar_one_or_none()
    except Exception:
        return None
