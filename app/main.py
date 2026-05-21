from fastapi import FastAPI

from app.routers import auth, notes

app = FastAPI(
    title="Notes API",
    description="Learning FastAPI — notes CRUD with SQLite persistence",
    version="0.4.0",
)

app.include_router(auth.router)
app.include_router(notes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
