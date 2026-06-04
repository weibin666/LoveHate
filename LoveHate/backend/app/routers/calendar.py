from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Record, RecordType
from app.schemas import RecordOut

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/monthly")
async def get_monthly_calendar(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    result = await db.execute(
        select(
            func.strftime("%Y-%m-%d", Record.created_at).label("date"),
            func.count().label("total"),
            func.sum(func.iif(Record.record_type == RecordType.GOOD, 1, 0)).label("good_count"),
            func.sum(func.iif(Record.record_type == RecordType.GRUDGE, 1, 0)).label("grudge_count"),
        )
        .where(
            Record.couple_id == current_user.couple_id,
            extract("year", Record.created_at) == year,
            extract("month", Record.created_at) == month,
        )
        .group_by("date")
    )
    rows = result.all()

    calendar = {}
    for row in rows:
        good = row.good_count or 0
        grudge = row.grudge_count or 0
        if good > grudge:
            mood = "good"
            color = "#4ade80"
        elif grudge > good:
            mood = "bad"
            color = "#a78bfa"
        else:
            mood = "neutral"
            color = "#fbbf24"
        calendar[row.date] = {
            "total": row.total,
            "good": good,
            "grudge": grudge,
            "mood": mood,
            "color": color,
        }

    return {"year": year, "month": month, "days": calendar}


@router.get("/weekly-report")
async def get_weekly_report(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    from datetime import timedelta
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    good_result = await db.execute(
        select(func.count()).select_from(Record).where(
            Record.couple_id == current_user.couple_id,
            Record.record_type == RecordType.GOOD,
            Record.created_at >= week_ago,
        )
    )
    grudge_result = await db.execute(
        select(func.count()).select_from(Record).where(
            Record.couple_id == current_user.couple_id,
            Record.record_type == RecordType.GRUDGE,
            Record.created_at >= week_ago,
        )
    )
    coins_result = await db.execute(
        select(func.sum(Record.coins_change)).where(
            Record.couple_id == current_user.couple_id,
            Record.created_at >= week_ago,
        )
    )

    good_count = good_result.scalar() or 0
    grudge_count = grudge_result.scalar() or 0
    total_coins = coins_result.scalar() or 0

    if good_count > grudge_count * 2:
        verdict = "甜蜜蜜的一周！你们太甜了 🍯"
    elif good_count > grudge_count:
        verdict = "总体甜蜜，小有摩擦 💕"
    elif good_count == grudge_count:
        verdict = "爱恨交织的一周 ⚖️"
    else:
        verdict = "这周火药味有点重啊 💣"

    return {
        "good_count": good_count,
        "grudge_count": grudge_count,
        "total_coins": total_coins,
        "verdict": verdict,
        "period": {
            "start": week_ago.strftime("%Y-%m-%d"),
            "end": now.strftime("%Y-%m-%d"),
        },
    }


@router.get("/daily/{date}")
async def get_daily_records(
    date: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    result = await db.execute(
        select(Record)
        .where(
            Record.couple_id == current_user.couple_id,
            func.strftime("%Y-%m-%d", Record.created_at) == date,
        )
        .order_by(Record.created_at.desc())
    )
    records = result.scalars().all()

    out = []
    for r in records:
        author_r = await db.execute(select(User).where(User.id == r.author_id))
        author = author_r.scalar_one()
        target_r = await db.execute(select(User).where(User.id == r.target_id))
        target_user = target_r.scalar_one()
        out.append({
            "id": r.id,
            "author_nickname": author.nickname,
            "target_nickname": target_user.nickname,
            "record_type": r.record_type.value,
            "emotion": r.emotion.value,
            "content": r.content,
            "image_url": r.image_url,
            "coins_change": r.coins_change,
            "created_at": r.created_at.isoformat(),
        })
    return out
