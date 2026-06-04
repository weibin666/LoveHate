from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Couple, Record, RecordType, Achievement, UserAchievement, Purchase, Letter

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


async def check_achievements(user_id: str, db: AsyncSession, couple_id: str = None):
    result = await db.execute(select(Achievement))
    all_achievements = result.scalars().all()

    result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user_id)
    )
    unlocked = result.scalars().all()
    unlocked_ids = {ua.achievement_id for ua in unlocked}

    stats: dict[str, float] = {}

    good_count_res = await db.execute(
        select(func.count()).select_from(Record).where(Record.author_id == user_id, Record.record_type == RecordType.GOOD)
    )
    stats["good_count"] = good_count_res.scalar() or 0

    grudge_count_res = await db.execute(
        select(func.count()).select_from(Record).where(Record.author_id == user_id, Record.record_type == RecordType.GRUDGE)
    )
    stats["grudge_count"] = grudge_count_res.scalar() or 0

    positive_coins_res = await db.execute(
        select(func.coalesce(func.sum(Record.coins_change), 0)).where(
            Record.author_id == user_id, Record.coins_change > 0
        )
    )
    stats["total_coins"] = positive_coins_res.scalar() or 0

    letter_count_res = await db.execute(
        select(func.count()).select_from(Letter).where(Letter.sender_id == user_id)
    )
    stats["letter_count"] = letter_count_res.scalar() or 0

    purchase_count_res = await db.execute(
        select(func.count()).select_from(Purchase).where(Purchase.buyer_id == user_id)
    )
    stats["purchase_count"] = purchase_count_res.scalar() or 0

    accept_letter_res = await db.execute(
        select(func.count()).select_from(Letter).where(
            Letter.sender_id != user_id,
            Letter.is_accepted == True,
            Letter.couple_id == couple_id,
        )
    )
    stats["accept_letter"] = accept_letter_res.scalar() or 0

    if couple_id:
        today = datetime.now(timezone.utc).date()
        daily_grudge_res = await db.execute(
            select(func.count()).select_from(Record).where(
                Record.couple_id == couple_id,
                Record.record_type == RecordType.GRUDGE,
                func.date(Record.created_at) == today,
            )
        )
        stats["daily_grudge"] = daily_grudge_res.scalar() or 0

        streak = 0
        check_date = today - timedelta(days=1)
        for _ in range(365):
            exists = await db.execute(
                select(func.count()).select_from(Record).where(
                    Record.couple_id == couple_id,
                    Record.record_type == RecordType.GOOD,
                    func.date(Record.created_at) == check_date,
                )
            )
            if (exists.scalar() or 0) > 0:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        stats["streak_good_days"] = streak

        no_grudge_streak = 0
        check_date2 = today - timedelta(days=1)
        for _ in range(365):
            g_exists = await db.execute(
                select(func.count()).select_from(Record).where(
                    Record.couple_id == couple_id,
                    Record.record_type == RecordType.GRUDGE,
                    func.date(Record.created_at) == check_date2,
                )
            )
            if (g_exists.scalar() or 0) == 0:
                no_grudge_streak += 1
                check_date2 -= timedelta(days=1)
            else:
                break
        stats["no_grudge_days"] = no_grudge_streak

        couple_res = await db.execute(select(Couple).where(Couple.id == couple_id))
        couple_obj = couple_res.scalar_one_or_none()
        if couple_obj and couple_obj.created_at:
            days = (datetime.now(timezone.utc) - couple_obj.created_at).days
            stats["couple_days"] = days
            stats["temp_reach"] = couple_obj.temperature
            stats["temp_drop"] = 100 - couple_obj.temperature
            stats["coldwar_count"] = 0

    new_unlocks = []
    for ach in all_achievements:
        if ach.id in unlocked_ids:
            continue
        val = stats.get(ach.condition_type)
        if val is not None and val >= ach.condition_value:
            ua = UserAchievement(user_id=user_id, achievement_id=ach.id)
            db.add(ua)
            new_unlocks.append(ach)

    if new_unlocks:
        await db.commit()

    return new_unlocks
