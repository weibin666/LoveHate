from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    nickname: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    nickname: str
    avatar: Optional[str] = None
    coins: int
    couple_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CoupleInfo(BaseModel):
    id: str
    invite_code: str
    status: str
    temperature: float
    cold_war_status: str
    partner: Optional[UserOut] = None
    anniversary: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RecordCreate(BaseModel):
    target_id: str
    record_type: str
    emotion: str
    content: str
    image_url: Optional[str] = None


class RecordOut(BaseModel):
    id: str
    author_id: str
    target_id: str
    record_type: str
    emotion: str
    content: str
    image_url: Optional[str] = None
    coins_change: int
    is_expired: bool
    created_at: datetime
    author_nickname: Optional[str] = None
    target_nickname: Optional[str] = None

    class Config:
        from_attributes = True


class LetterCreate(BaseModel):
    letter_type: str
    content: str


class LetterOut(BaseModel):
    id: str
    sender_id: str
    letter_type: str
    content: str
    is_accepted: Optional[bool] = None
    created_at: datetime
    sender_nickname: Optional[str] = None

    class Config:
        from_attributes = True


class ShopItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    item_type: str
    price: int


class ShopItemOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    item_type: str
    price: int
    is_custom: bool

    class Config:
        from_attributes = True


class PurchaseOut(BaseModel):
    id: str
    buyer_id: str
    item_id: str
    target_id: str
    is_used: bool
    created_at: datetime
    item_name: Optional[str] = None

    class Config:
        from_attributes = True


class CouplePairRequest(BaseModel):
    invite_code: str


class ColdWarReconcile(BaseModel):
    want_reconcile: bool


class LetterAccept(BaseModel):
    accepted: bool
