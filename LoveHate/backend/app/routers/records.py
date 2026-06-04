from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import User, Couple, Record, RecordType, EmotionTag, ColdWarStatus, CoupleStatus
from app.schemas import RecordCreate, RecordOut

router = APIRouter(prefix="/api/records", tags=["records"])

EMOTION_MAP = {
    "furious": {"label": "暴怒", "emoji": "😡", "weight": 3},
    "angry": {"label": "不爽", "emoji": "😤", "weight": 2},
    "annoyed": {"label": "微烦", "emoji": "😒", "weight": 1},
    "happy": {"label": "开心", "emoji": "😊", "weight": 1},
    "warm": {"label": "超暖", "emoji": "🥰", "weight": 2},
    "heart": {"label": "心动", "emoji": "😍", "weight": 3},
}


@router.post("", response_model=RecordOut)
async def create_record(
    data: RecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    result = await db.execute(select(Couple).where(Couple.id == current_user.couple_id))
    couple = result.scalar_one_or_none()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")

    result = await db.execute(select(User).where(User.id == data.target_id, User.couple_id == current_user.couple_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=400, detail="Target is not your partner")

    try:
        record_type = RecordType(data.record_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid record type")

    try:
        emotion = EmotionTag(data.emotion)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid emotion tag")

    if record_type == RecordType.GOOD:
        coins_change = settings.COINS_PER_GOOD * EMOTION_MAP[data.emotion]["weight"]
    else:
        coins_change = settings.COINS_PER_GRUDGE * EMOTION_MAP[data.emotion]["weight"]

    expires_at = None
    if record_type == RecordType.GRUDGE:
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.GRUDGE_EXPIRE_DAYS)

    record = Record(
        couple_id=current_user.couple_id,
        author_id=current_user.id,
        target_id=data.target_id,
        record_type=record_type,
        emotion=emotion,
        content=data.content,
        image_url=data.image_url,
        coins_change=coins_change,
        expires_at=expires_at,
    )
    db.add(record)

    current_user.coins += coins_change

    weight = EMOTION_MAP[data.emotion]["weight"]
    if record_type == RecordType.GOOD:
        couple.temperature = min(100.0, couple.temperature + settings.TEMP_PER_GOOD * weight)
    else:
        couple.temperature = max(0.0, couple.temperature + settings.TEMP_PER_GRUDGE * weight)

    if record_type == RecordType.GRUDGE:
        recent_result = await db.execute(
            select(func.count())
            .select_from(Record)
            .where(
                Record.couple_id == couple.id,
                Record.record_type == RecordType.GRUDGE,
                Record.created_at >= datetime.now(timezone.utc) - timedelta(hours=24),
            )
        )
        recent_grudge_count = recent_result.scalar()
        if recent_grudge_count >= 3 and couple.cold_war_status != ColdWarStatus.ACTIVE:
            couple.cold_war_status = ColdWarStatus.ACTIVE
            couple.cold_war_start = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(record)

    result = await db.execute(select(User).where(User.id == record.author_id))
    author = result.scalar_one()
    result = await db.execute(select(User).where(User.id == record.target_id))
    target_user = result.scalar_one()

    return RecordOut(
        id=record.id,
        author_id=record.author_id,
        target_id=record.target_id,
        record_type=record.record_type.value,
        emotion=record.emotion.value,
        content=record.content,
        image_url=record.image_url,
        coins_change=record.coins_change,
        is_expired=record.is_expired,
        created_at=record.created_at,
        author_nickname=author.nickname,
        target_nickname=target_user.nickname,
    )


@router.get("", response_model=list[RecordOut])
async def get_records(
    record_type: str = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    query = select(Record).where(Record.couple_id == current_user.couple_id)
    if record_type:
        try:
            rt = RecordType(record_type)
            query = query.where(Record.record_type == rt)
        except ValueError:
            pass

    query = query.order_by(Record.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    records = result.scalars().all()

    out = []
    for r in records:
        result = await db.execute(select(User).where(User.id == r.author_id))
        author = result.scalar_one()
        result = await db.execute(select(User).where(User.id == r.target_id))
        target_user = result.scalar_one()
        out.append(
            RecordOut(
                id=r.id,
                author_id=r.author_id,
                target_id=r.target_id,
                record_type=r.record_type.value,
                emotion=r.emotion.value,
                content=r.content,
                image_url=r.image_url,
                coins_change=r.coins_change,
                is_expired=r.is_expired,
                created_at=r.created_at,
                author_nickname=author.nickname,
                target_nickname=target_user.nickname,
            )
        )
    return out


@router.get("/stats")
async def get_record_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    good_count_result = await db.execute(
        select(func.count())
        .select_from(Record)
        .where(Record.couple_id == current_user.couple_id, Record.record_type == RecordType.GOOD)
    )
    grudge_count_result = await db.execute(
        select(func.count())
        .select_from(Record)
        .where(Record.couple_id == current_user.couple_id, Record.record_type == RecordType.GRUDGE)
    )

    emotion_counts = {}
    for emotion in EmotionTag:
        result = await db.execute(
            select(func.count())
            .select_from(Record)
            .where(Record.couple_id == current_user.couple_id, Record.emotion == emotion)
        )
        emotion_counts[emotion.value] = result.scalar()

    return {
        "good_count": good_count_result.scalar(),
        "grudge_count": grudge_count_result.scalar(),
        "emotion_counts": emotion_counts,
    }


@router.delete("/{record_id}")
async def delete_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Record).where(Record.id == record_id, Record.author_id == current_user.id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    current_user.coins = max(0, current_user.coins - record.coins_change)
    await db.delete(record)
    await db.commit()
    return {"detail": "Record deleted"}


@router.post("/{record_id}/renew")
async def renew_grudge(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Record).where(
            Record.id == record_id,
            Record.record_type == RecordType.GRUDGE,
            Record.couple_id == current_user.couple_id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Grudge not found")

    renew_cost = 10
    if current_user.coins < renew_cost:
        raise HTTPException(status_code=400, detail=f"Not enough coins (need {renew_cost})")

    current_user.coins -= renew_cost
    record.expires_at = datetime.now(timezone.utc) + timedelta(days=settings.GRUDGE_EXPIRE_DAYS)
    record.is_renewed = True
    await db.commit()

    return {"detail": f"记仇续期成功！又多了{settings.GRUDGE_EXPIRE_DAYS}天", "expires_at": record.expires_at.isoformat()}
