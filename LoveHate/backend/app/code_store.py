import json
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

CODE_STORE: dict = {}

EXPIRE_SECONDS = 300
RATE_LIMIT_SECONDS = 60


async def store_code(phone: str, code: str) -> None:
    try:
        import redis
        from app.config import settings
        r = redis.from_url(settings.REDIS_URL)
        r.setex(f"sms:{phone}", EXPIRE_SECONDS, json.dumps({"code": code, "sent_at": datetime.now(timezone.utc).isoformat()}))
        r.close()
    except Exception:
        CODE_STORE[phone] = {"code": code, "sent_at": datetime.now(timezone.utc).isoformat(), "expires": datetime.now(timezone.utc) + timedelta(seconds=EXPIRE_SECONDS)}


async def verify_code(phone: str, code: str) -> bool:
    try:
        import redis
        from app.config import settings
        r = redis.from_url(settings.REDIS_URL)
        data = r.get(f"sms:{phone}")
        r.close()
        if data:
            stored = json.loads(data)
            return stored["code"] == code
    except Exception:
        pass

    stored = CODE_STORE.get(phone)
    if not stored:
        return False
    if datetime.now(timezone.utc) > stored["expires"]:
        del CODE_STORE[phone]
        return False
    return stored["code"] == code


async def check_rate_limit(phone: str) -> bool:
    try:
        import redis
        from app.config import settings
        r = redis.from_url(settings.REDIS_URL)
        key = f"sms_rate:{phone}"
        if r.exists(key):
            r.close()
            return False
        r.setex(key, RATE_LIMIT_SECONDS, "1")
        r.close()
        return True
    except Exception:
        pass

    stored = CODE_STORE.get(phone)
    if stored and (datetime.now(timezone.utc) - stored["sent_at"]).total_seconds() < RATE_LIMIT_SECONDS:
        return False
    return True
