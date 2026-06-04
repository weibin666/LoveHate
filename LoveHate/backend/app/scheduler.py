import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update, and_

from app.database import async_session
from app.models import Record, RecordType, Couple, ColdWarStatus
from app.config import settings
from app.ws import manager

logger = logging.getLogger(__name__)


async def expire_old_grudges():
    async with async_session() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Record).where(
                Record.record_type == RecordType.GRUDGE,
                Record.is_expired == False,
                Record.expires_at != None,
                Record.expires_at < now,
            )
        )
        records = result.scalars().all()
        if records:
            for r in records:
                r.is_expired = True
            await db.commit()
            logger.info(f"Expired {len(records)} grudge records")

            couple_ids = set(r.couple_id for r in records)
            for cid in couple_ids:
                await manager.send_to_couple(cid, {
                    "type": "grudge_expired",
                    "message": f"{len([r for r in records if r.couple_id == cid])}条记仇已自动原谅～",
                })


async def decay_temperature():
    async with async_session() as db:
        result = await db.execute(
            select(Couple).where(Couple.status == "active")
        )
        couples = result.scalars().all()
        updated = 0
        for c in couples:
            if c.temperature > settings.TEMP_BASE_LINE:
                c.temperature = max(settings.TEMP_BASE_LINE, c.temperature - 0.1)
                updated += 1
        if updated:
            await db.commit()
            logger.info(f"Temperature decayed for {updated} couples")


async def auto_resolve_cold_wars():
    async with async_session() as db:
        threshold = datetime.now(timezone.utc) - timedelta(hours=72)
        result = await db.execute(
            select(Couple).where(
                Couple.cold_war_status == ColdWarStatus.ACTIVE,
                Couple.cold_war_start != None,
                Couple.cold_war_start < threshold,
            )
        )
        couples = result.scalars().all()
        for c in couples:
            c.cold_war_status = ColdWarStatus.RESOLVED
            c.cold_war_start = None
            await manager.send_to_couple(c.id, {
                "type": "coldwar_auto_resolved",
                "message": "冷战已超过72小时，自动和解～ 冰层融化了 💔➡️❤️",
            })
        if couples:
            await db.commit()
            logger.info(f"Auto-resolved {len(couples)} cold wars")


async def run_scheduled_tasks():
    await expire_old_grudges()
    await decay_temperature()
    await auto_resolve_cold_wars()
