from fastapi import FastAPI

from app.routers import notes

app = FastAPI(
    title="Notes API",
    description="Learning FastAPI — notes CRUD with SQLite persistence",
    version="0.3.0",
)

app.include_router(notes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
