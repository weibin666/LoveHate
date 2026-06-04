from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Couple, ShopItem, Purchase, ItemType, ColdWarStatus
from app.schemas import ShopItemCreate, ShopItemOut, PurchaseOut, LetterCreate, LetterOut, ColdWarReconcile, LetterAccept

router = APIRouter(prefix="/api/game", tags=["game"])

DEFAULT_ITEMS = [
    {"name": "捏肩15分钟", "description": "对方必须给你捏肩15分钟", "item_type": "punishment", "price": 20},
    {"name": "今晚你洗碗", "description": "今晚的碗归对方洗", "item_type": "punishment", "price": 25},
    {"name": "不许玩游戏1小时", "description": "对方1小时内不许打游戏", "item_type": "punishment", "price": 30},
    {"name": "清空购物车一件", "description": "对方帮你清空购物车中一件商品", "item_type": "punishment", "price": 50},
    {"name": "无条件拥抱", "description": "获得对方一个无条件的温暖拥抱", "item_type": "reward", "price": 10},
    {"name": "挑选约会地点", "description": "下次约会你说了算", "item_type": "reward", "price": 15},
    {"name": "做一顿爱心餐", "description": "对方为你做一顿饭", "item_type": "reward", "price": 30},
    {"name": "写一封情书", "description": "对方必须手写一封情书给你", "item_type": "reward", "price": 35},
]


@router.get("/shop", response_model=list[ShopItemOut])
async def get_shop_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    result = await db.execute(select(ShopItem).where(ShopItem.couple_id == current_user.couple_id))
    items = result.scalars().all()

    if not items:
        for item_data in DEFAULT_ITEMS:
            item = ShopItem(
                couple_id=current_user.couple_id,
                is_custom=False,
                **item_data,
            )
            db.add(item)
        await db.commit()
        result = await db.execute(select(ShopItem).where(ShopItem.couple_id == current_user.couple_id))
        items = result.scalars().all()

    return items


@router.post("/shop", response_model=ShopItemOut)
async def create_shop_item(
    data: ShopItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    item = ShopItem(
        couple_id=current_user.couple_id,
        name=data.name,
        description=data.description,
        item_type=ItemType(data.item_type),
        price=data.price,
        is_custom=True,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/shop/{item_id}/buy", response_model=PurchaseOut)
async def buy_item(
    item_id: str,
    target_id: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ShopItem).where(ShopItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if current_user.coins < item.price:
        raise HTTPException(status_code=400, detail="Not enough coins")

    if not target_id:
        result = await db.execute(select(User).where(User.couple_id == current_user.couple_id, User.id != current_user.id))
        partner = result.scalar_one_or_none()
        target_id = partner.id if partner else current_user.id

    current_user.coins -= item.price
    purchase = Purchase(
        buyer_id=current_user.id,
        item_id=item.id,
        target_id=target_id,
    )
    db.add(purchase)
    await db.commit()
    await db.refresh(purchase)

    return PurchaseOut(
        id=purchase.id,
        buyer_id=purchase.buyer_id,
        item_id=purchase.item_id,
        target_id=purchase.target_id,
        is_used=purchase.is_used,
        created_at=purchase.created_at,
        item_name=item.name,
    )


@router.get("/purchases", response_model=list[PurchaseOut])
async def get_purchases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Purchase)
        .where((Purchase.buyer_id == current_user.id) | (Purchase.target_id == current_user.id))
        .order_by(Purchase.created_at.desc())
    )
    purchases = result.scalars().all()
    out = []
    for p in purchases:
        item_result = await db.execute(select(ShopItem).where(ShopItem.id == p.item_id))
        item = item_result.scalar_one_or_none()
        out.append(
            PurchaseOut(
                id=p.id,
                buyer_id=p.buyer_id,
                item_id=p.item_id,
                target_id=p.target_id,
                is_used=p.is_used,
                created_at=p.created_at,
                item_name=item.name if item else "Unknown",
            )
        )
    return out


@router.post("/coldwar/reconcile")
async def cold_war_reconcile(
    data: ColdWarReconcile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    result = await db.execute(select(Couple).where(Couple.id == current_user.couple_id))
    couple = result.scalar_one_or_none()
    if not couple or couple.cold_war_status != ColdWarStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="No active cold war")

    reconcile_key = f"reconcile_{current_user.id}"
    if not hasattr(couple, '_reconcile_votes'):
        couple._reconcile_votes = {}

    if data.want_reconcile:
        couple._reconcile_votes[current_user.id] = True

    result = await db.execute(select(User).where(User.couple_id == couple.id, User.id != current_user.id))
    partner = result.scalar_one_or_none()

    if data.want_reconcile and partner:
        couple.cold_war_status = ColdWarStatus.RESOLVED
        couple.cold_war_start = None
        couple.temperature = min(100.0, couple.temperature + 10)
        await db.commit()
        return {"status": "resolved", "message": "冷战结束！冰层碎裂～ 💔➡️❤️"}

    await db.commit()
    return {"status": "waiting", "message": "等待对方也选择和好..."}


@router.post("/letter", response_model=LetterOut)
async def send_letter(
    data: LetterCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models import Letter

    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    letter = Letter(
        couple_id=current_user.couple_id,
        sender_id=current_user.id,
        letter_type=data.letter_type,
        content=data.content,
    )
    db.add(letter)
    await db.commit()
    await db.refresh(letter)

    return LetterOut(
        id=letter.id,
        sender_id=letter.sender_id,
        letter_type=letter.letter_type,
        content=letter.content,
        is_accepted=letter.is_accepted,
        created_at=letter.created_at,
        sender_nickname=current_user.nickname,
    )


@router.get("/letters", response_model=list[LetterOut])
async def get_letters(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models import Letter

    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    result = await db.execute(
        select(Letter)
        .where(Letter.couple_id == current_user.couple_id)
        .order_by(Letter.created_at.desc())
    )
    letters = result.scalars().all()

    out = []
    for l in letters:
        sender_result = await db.execute(select(User).where(User.id == l.sender_id))
        sender = sender_result.scalar_one()
        out.append(
            LetterOut(
                id=l.id,
                sender_id=l.sender_id,
                letter_type=l.letter_type,
                content=l.content,
                is_accepted=l.is_accepted,
                created_at=l.created_at,
                sender_nickname=sender.nickname,
            )
        )
    return out


@router.post("/letter/{letter_id}/accept")
async def accept_letter(
    letter_id: str,
    data: LetterAccept,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models import Letter

    result = await db.execute(select(Letter).where(Letter.id == letter_id, Letter.couple_id == current_user.couple_id))
    letter = result.scalar_one_or_none()
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")

    if letter.sender_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot accept your own letter")

    letter.is_accepted = data.accepted
    if data.accepted:
        current_user.coins += 5

    await db.commit()
    return {"detail": "Accepted" if data.accepted else "Rejected"}
