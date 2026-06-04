from fastapi import FastAPI

from app.routers import auth, notes
from app.version import get_product_version

app = FastAPI(
    title="Notes API",
    description="Learning FastAPI — notes CRUD with SQLite persistence",
    version=get_product_version(),
)

app.include_router(auth.router)
app.include_router(notes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": get_product_version()}
