from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Couple, CoupleStatus, UserAchievement, Achievement
from app.schemas import CoupleInfo, CouplePairRequest, UserOut

router = APIRouter(prefix="/api/couple", tags=["couple"])


@router.post("/create", response_model=CoupleInfo)
async def create_couple(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.couple_id:
        raise HTTPException(status_code=400, detail="Already in a couple")

    couple = Couple()
    db.add(couple)
    await db.flush()

    current_user.couple_id = couple.id

    achievement = Achievement(
        name="结对成功",
        description="成功创建情侣关系",
        icon="💑",
        condition_type="couple_created",
        condition_value=1,
    )
    db.add(achievement)
    await db.flush()

    ua = UserAchievement(user_id=current_user.id, achievement_id=achievement.id)
    db.add(ua)

    await db.commit()
    await db.refresh(couple)

    result = await db.execute(select(User).where(User.couple_id == couple.id, User.id != current_user.id))
    partner = result.scalar_one_or_none()

    return CoupleInfo(
        id=couple.id,
        invite_code=couple.invite_code,
        status=couple.status.value,
        temperature=couple.temperature,
        cold_war_status=couple.cold_war_status.value,
        anniversary=couple.anniversary,
        partner=UserOut.model_validate(partner) if partner else None,
        created_at=couple.created_at,
    )


@router.get("/info", response_model=CoupleInfo)
async def get_couple_info(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    result = await db.execute(select(Couple).where(Couple.id == current_user.couple_id))
    couple = result.scalar_one_or_none()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")

    result = await db.execute(select(User).where(User.couple_id == couple.id, User.id != current_user.id))
    partner = result.scalar_one_or_none()

    return CoupleInfo(
        id=couple.id,
        invite_code=couple.invite_code,
        status=couple.status.value,
        temperature=couple.temperature,
        cold_war_status=couple.cold_war_status.value,
        anniversary=couple.anniversary,
        partner=UserOut.model_validate(partner) if partner else None,
        created_at=couple.created_at,
    )


@router.post("/pair", response_model=CoupleInfo)
async def pair_couple(
    data: CouplePairRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.couple_id:
        raise HTTPException(status_code=400, detail="Already in a couple")

    result = await db.execute(select(Couple).where(Couple.invite_code == data.invite_code, Couple.status == CoupleStatus.ACTIVE))
    couple = result.scalar_one_or_none()
    if not couple:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    result = await db.execute(select(User).where(User.couple_id == couple.id))
    existing_members = result.scalars().all()
    if len(existing_members) >= 2:
        raise HTTPException(status_code=400, detail="Couple already full")

    current_user.couple_id = couple.id
    await db.commit()
    await db.refresh(couple)

    result = await db.execute(select(User).where(User.couple_id == couple.id, User.id != current_user.id))
    partner = result.scalar_one_or_none()

    return CoupleInfo(
        id=couple.id,
        invite_code=couple.invite_code,
        status=couple.status.value,
        temperature=couple.temperature,
        cold_war_status=couple.cold_war_status.value,
        anniversary=couple.anniversary,
        partner=UserOut.model_validate(partner) if partner else None,
        created_at=couple.created_at,
    )
