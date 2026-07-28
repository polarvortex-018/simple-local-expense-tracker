from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.db.init_db import init_db
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and configure logging
    setup_logging()
    
    # Run DB creation and seed defaults
    with Session(engine) as session:
        init_db(session)
        
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict origins in production settings later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception mappings
register_exception_handlers(app)

# Include v1 REST API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["status"])
def read_root() -> dict:
    """Simple health check endpoint."""
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "api_documentation": "/docs"
    }
