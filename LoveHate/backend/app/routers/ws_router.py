from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from jose import JWTError, jwt

from app.config import settings
from app.ws import manager
from app.database import async_session
from app.models import User
from sqlalchemy import select

router = APIRouter(tags=["websocket"])


async def authenticate_ws(token: str) -> User | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        async with async_session() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            return result.scalar_one_or_none()
    except JWTError:
        return None


@router.websocket("/ws/notify")
async def ws_notify(websocket: WebSocket, token: str = Query(...)):
    user = await authenticate_ws(token)
    if not user or not user.couple_id:
        await websocket.close(code=4001)
        return

    couple_id = user.couple_id
    await manager.connect(couple_id, websocket)

    await manager.send_to_couple(couple_id, {
        "type": "online",
        "user_id": user.id,
        "nickname": user.nickname,
    })

    try:
        while True:
            data = await websocket.receive_text()
            import json
            msg = json.loads(data)
            msg["from_user"] = user.id
            msg["from_nickname"] = user.nickname
            await manager.send_to_user(couple_id, websocket, msg)
    except WebSocketDisconnect:
        manager.disconnect(couple_id, websocket)
        await manager.send_to_couple(couple_id, {
            "type": "offline",
            "user_id": user.id,
        })
