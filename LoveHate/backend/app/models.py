import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, Integer, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.sqlite import CHAR

from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def generate_code():
    import random
    return "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", k=6))


class CoupleStatus(str, enum.Enum):
    ACTIVE = "active"
    BROKEN = "broken"


class RecordType(str, enum.Enum):
    GOOD = "good"
    GRUDGE = "grudge"


class EmotionTag(str, enum.Enum):
    FURIOUS = "furious"
    ANGRY = "angry"
    ANNOYED = "annoyed"
    HAPPY = "happy"
    WARM = "warm"
    HEART = "heart"


class ColdWarStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"


class ItemType(str, enum.Enum):
    PUNISHMENT = "punishment"
    REWARD = "reward"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=True, index=True)
    nickname: Mapped[str] = mapped_column(String(50))
    hashed_password: Mapped[str] = mapped_column(String(128))
    avatar: Mapped[str] = mapped_column(String(255), nullable=True)
    coins: Mapped[int] = mapped_column(Integer, default=100)
    couple_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("couples.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    couple = relationship("Couple", back_populates="users")
    records = relationship("Record", back_populates="author", foreign_keys="Record.author_id")
    sent_letters = relationship("Letter", back_populates="sender", foreign_keys="Letter.sender_id")
    achievements = relationship("UserAchievement", back_populates="user")
    purchases = relationship("Purchase", back_populates="user", foreign_keys="Purchase.buyer_id")


class Couple(Base):
    __tablename__ = "couples"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    invite_code: Mapped[str] = mapped_column(String(6), unique=True, default=generate_code)
    status: Mapped[CoupleStatus] = mapped_column(Enum(CoupleStatus), default=CoupleStatus.ACTIVE)
    anniversary: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    temperature: Mapped[float] = mapped_column(Float, default=36.5)
    cold_war_status: Mapped[ColdWarStatus] = mapped_column(Enum(ColdWarStatus), default=ColdWarStatus.RESOLVED)
    cold_war_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    users = relationship("User", back_populates="couple")
    records = relationship("Record", back_populates="couple")
    shop_items = relationship("ShopItem", back_populates="couple")


class Record(Base):
    __tablename__ = "records"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    couple_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("couples.id"))
    author_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("users.id"))
    target_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("users.id"))
    record_type: Mapped[RecordType] = mapped_column(Enum(RecordType))
    emotion: Mapped[EmotionTag] = mapped_column(Enum(EmotionTag))
    content: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    coins_change: Mapped[int] = mapped_column(Integer, default=0)
    is_expired: Mapped[bool] = mapped_column(Boolean, default=False)
    is_renewed: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    couple = relationship("Couple", back_populates="records")
    author = relationship("User", back_populates="records", foreign_keys=[author_id])


class Letter(Base):
    __tablename__ = "letters"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    couple_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("couples.id"))
    sender_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("users.id"))
    letter_type: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    is_accepted: Mapped[bool] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    sender = relationship("User", back_populates="sent_letters", foreign_keys=[sender_id])


class ShopItem(Base):
    __tablename__ = "shop_items"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    couple_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("couples.id"))
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    item_type: Mapped[ItemType] = mapped_column(Enum(ItemType))
    price: Mapped[int] = mapped_column(Integer)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    couple = relationship("Couple", back_populates="shop_items")


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    buyer_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("users.id"))
    item_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("shop_items.id"))
    target_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("users.id"))
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    user = relationship("User", back_populates="purchases", foreign_keys=[buyer_id])


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(50))
    condition_type: Mapped[str] = mapped_column(String(50))
    condition_value: Mapped[int] = mapped_column(Integer)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("users.id"))
    achievement_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("achievements.id"))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    user = relationship("User", back_populates="achievements")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    couple_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("couples.id"))
    author_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    mood: Mapped[str] = mapped_column(String(20), nullable=True)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    author = relationship("User", foreign_keys=[author_id])


class PostLike(Base):
    __tablename__ = "post_likes"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=generate_uuid)
    post_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("posts.id"))
    user_id: Mapped[str] = mapped_column(CHAR(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
