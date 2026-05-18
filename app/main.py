from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import init_db
from app.routers import notes


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Notes API",
    description="Learning FastAPI — notes CRUD with SQLite persistence",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(notes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
