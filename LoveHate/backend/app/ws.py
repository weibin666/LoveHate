import json
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, Set[WebSocket]] = {}

    async def connect(self, couple_id: str, ws: WebSocket):
        await ws.accept()
        if couple_id not in self.active:
            self.active[couple_id] = set()
        self.active[couple_id].add(ws)

    def disconnect(self, couple_id: str, ws: WebSocket):
        if couple_id in self.active:
            self.active[couple_id].discard(ws)
            if not self.active[couple_id]:
                del self.active[couple_id]

    async def send_to_couple(self, couple_id: str, message: dict):
        if couple_id in self.active:
            data = json.dumps(message, ensure_ascii=False)
            dead = []
            for ws in self.active[couple_id]:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active[couple_id].discard(ws)

    async def send_to_user(self, couple_id: str, exclude_ws: WebSocket, message: dict):
        if couple_id in self.active:
            data = json.dumps(message, ensure_ascii=False)
            dead = []
            for ws in self.active[couple_id]:
                if ws == exclude_ws:
                    continue
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active[couple_id].discard(ws)


manager = ConnectionManager()
