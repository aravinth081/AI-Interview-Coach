"""
Main entry point for the AI Interview Coach FastAPI application.
Configures middleware, routers, and lifecycle events.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db, close_db
from app.middleware.middleware import RequestLoggingMiddleware, RateLimitMiddleware, ErrorHandlingMiddleware
from app.api.v1.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("interview_coach")

settings = get_settings()

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Real-time AI Interview Coach SaaS Backend",
        docs_url=f"{settings.API_PREFIX}/docs",
        redoc_url=f"{settings.API_PREFIX}/redoc",
        openapi_url=f"{settings.API_PREFIX}/openapi.json",
    )

    # Middleware
    app.add_middleware(ErrorHandlingMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimitMiddleware, max_requests=settings.RATE_LIMIT_PER_MINUTE)

    # Routers
    app.include_router(api_router, prefix=settings.API_PREFIX)

    @app.on_event("startup")
    async def startup_event():
        logger.info("Starting up AI Interview Coach...")
        await init_db()

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down AI Interview Coach...")
        await close_db()

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": settings.APP_VERSION}

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=settings.WORKERS,
    )
