from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Record, RecordType, Achievement, UserAchievement

router = APIRouter(prefix="/api/achievements", tags=["achievements"])

ACHIEVEMENT_DEFS = [
    {"name": "初次记好", "description": "第一次记好", "icon": "💚", "condition_type": "good_count", "condition_value": 1},
    {"name": "初次记仇", "description": "第一次记仇", "icon": "💜", "condition_type": "grudge_count", "condition_value": 1},
    {"name": "甜蜜达人", "description": "累计记好10次", "icon": "🏆", "condition_type": "good_count", "condition_value": 10},
    {"name": "记仇大王", "description": "累计记仇10次", "icon": "👑", "condition_type": "grudge_count", "condition_value": 10},
    {"name": "百年好合", "description": "连续30天无记仇", "icon": "💒", "condition_type": "no_grudge_days", "condition_value": 30},
    {"name": "爱情富豪", "description": "累计获得500爱情币", "icon": "💰", "condition_type": "total_coins", "condition_value": 500},
    {"name": "写信高手", "description": "发送5封信", "icon": "✉️", "condition_type": "letter_count", "condition_value": 5},
    {"name": "购物狂", "description": "购买10张券", "icon": "🛒", "condition_type": "purchase_count", "condition_value": 10},
    {"name": "冷战终结者", "description": "经历3次冷战并和好", "icon": "🧊", "condition_type": "coldwar_count", "condition_value": 3},
    {"name": "甜蜜蜜", "description": "连续7天记好", "icon": "🍯", "condition_type": "streak_good_days", "condition_value": 7},
    {"name": "暴风骤雨", "description": "单日记仇5次", "icon": "⛈️", "condition_type": "daily_grudge", "condition_value": 5},
    {"name": "黄金温度", "description": "关系温度达到80度", "icon": "🌡️", "condition_type": "temp_reach", "condition_value": 80},
    {"name": "冰点危机", "description": "关系温度降到20度以下", "icon": "🥶", "condition_type": "temp_drop", "condition_value": 20},
    {"name": "恋爱老司机", "description": "结对超过100天", "icon": "🚗", "condition_type": "couple_days", "condition_value": 100},
    {"name": "宽宏大量", "description": "接受5次道歉信", "icon": "🤗", "condition_type": "accept_letter", "condition_value": 5},
]


@router.get("")
async def get_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Achievement))
    existing = result.scalars().all()
    existing_types = {a.condition_type for a in existing}

    for ach_def in ACHIEVEMENT_DEFS:
        if ach_def["condition_type"] not in existing_types:
            ach = Achievement(**ach_def)
            db.add(ach)
    await db.commit()

    result = await db.execute(select(Achievement))
    all_achievements = result.scalars().all()

    result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    )
    unlocked = result.scalars().all()
    unlocked_ids = {ua.achievement_id for ua in unlocked}

    return [
        {
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "icon": a.icon,
            "unlocked": a.id in unlocked_ids,
        }
        for a in all_achievements
    ]


async def check_achievements(user_id: str, db: AsyncSession):
    result = await db.execute(select(Achievement))
    all_achievements = result.scalars().all()

    result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user_id)
    )
    unlocked = result.scalars().all()
    unlocked_ids = {ua.achievement_id for ua in unlocked}

    good_count = await db.execute(
        select(func.count()).select_from(Record).where(Record.author_id == user_id, Record.record_type == RecordType.GOOD)
    )
    grudge_count = await db.execute(
        select(func.count()).select_from(Record).where(Record.author_id == user_id, Record.record_type == RecordType.GRUDGE)
    )

    stats = {"good_count": good_count.scalar() or 0, "grudge_count": grudge_count.scalar() or 0}

    new_unlocks = []
    for ach in all_achievements:
        if ach.id in unlocked_ids:
            continue
        if ach.condition_type in stats and stats[ach.condition_type] >= ach.condition_value:
            ua = UserAchievement(user_id=user_id, achievement_id=ach.id)
            db.add(ua)
            new_unlocks.append(ach)

    if new_unlocks:
        await db.commit()

    return new_unlocks
