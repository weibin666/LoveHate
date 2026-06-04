from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, couple, records, game, upload, ws_router, calendar, achievements
from app.security import rate_limit_middleware


async def start_scheduler():
    import asyncio
    from app.scheduler import run_scheduled_tasks

    async def loop():
        while True:
            try:
                await run_scheduled_tasks()
            except Exception as e:
                print(f"Scheduler error: {e}")
            await asyncio.sleep(3600)

    asyncio.create_task(loop())


@asynccontextmanager
async def lifespan(application: FastAPI):
    await init_db()
    await start_scheduler()
    yield


app = FastAPI(
    title="LoveHate API",
    description="爱恨情仇 - 情侣情绪博弈场",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(rate_limit_middleware)

app.include_router(auth.router)
app.include_router(couple.router)
app.include_router(records.router)
app.include_router(game.router)
app.include_router(upload.router)
app.include_router(ws_router.router)
app.include_router(calendar.router)
app.include_router(achievements.router)


@app.get("/")
async def root():
    return {"app": "LoveHate", "version": "1.0.0", "message": "爱恨情仇 - 情侣情绪博弈场"}
