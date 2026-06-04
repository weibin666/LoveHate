from datetime import datetime, timezone

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserOut, Token
from app.sms import get_sms_provider, generate_code
from app.code_store import store_code, verify_code, check_rate_limit

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SmsLoginRequest(BaseModel):
    phone: str
    code: str


class SendCodeRequest(BaseModel):
    phone: str


@router.post("/register", response_model=UserOut)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(
        username=user_data.username,
        nickname=user_data.nickname,
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/sms/send")
async def send_sms_code(data: SendCodeRequest):
    if not data.phone or len(data.phone) < 11:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    if not await check_rate_limit(data.phone):
        raise HTTPException(status_code=429, detail="Please wait before requesting another code")

    code = generate_code()
    provider = get_sms_provider()
    success = await provider.send_code(data.phone, code)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send SMS")

    await store_code(data.phone, code)
    return {"detail": "Code sent"}


@router.post("/sms/login", response_model=Token)
async def sms_login(data: SmsLoginRequest, db: AsyncSession = Depends(get_db)):
    if not await verify_code(data.phone, data.code):
        raise HTTPException(status_code=401, detail="Invalid or expired code")

    result = await db.execute(select(User).where(User.phone == data.phone))
    user = result.scalar_one_or_none()

    if not user:
        import uuid
        username = f"user_{data.phone[-4:]}"
        user = User(
            id=str(uuid.uuid4()),
            username=username,
            nickname=f"用户{data.phone[-4:]}",
            phone=data.phone,
            hashed_password=get_password_hash(str(uuid.uuid4())),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token)
