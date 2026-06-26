from pathlib import Path

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal, run_migrations
from app.core.seed import seed_defaults
from app.api import auth, users, lost_items, found_items, claims, notifications, categories, locations, matching

# Create database tables
Base.metadata.create_all(bind=engine)
run_migrations()
with SessionLocal() as db:
    seed_defaults(db)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Campus Lost & Found Network - A full-stack application for reporting and finding lost items on campus.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(lost_items.router, prefix="/api/lost-items", tags=["Lost Items"])
app.include_router(found_items.router, prefix="/api/found-items", tags=["Found Items"])
app.include_router(claims.router, prefix="/api/claims", tags=["Claims"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(locations.router, prefix="/api/locations", tags=["Locations"])
app.include_router(matching.router, prefix="/api/matching", tags=["AI Matching"])


@app.get("/")
def root():
    """
    Root endpoint with API information.
    """
    return {
        "message": "Campus Lost & Found Network API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "status": "operational"
    }


@app.get("/api/health")
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler.
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred",
            "error": str(exc) if settings.DEBUG else "Internal error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
