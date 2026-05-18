from fastapi import FastAPI

from app.routers import notes

app = FastAPI(
    title="Notes API",
    description="Learning FastAPI — in-memory notes CRUD",
    version="0.1.0",
)

app.include_router(notes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
