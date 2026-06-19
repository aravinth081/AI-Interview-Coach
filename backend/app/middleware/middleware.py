"""
Middleware for request logging, rate limiting, and error handling.
"""

import time
import logging
from typing import Callable
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timezone

logger = logging.getLogger("interview_coach")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all incoming requests with timing information."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Generate request ID
        request_id = f"{int(time.time() * 1000)}"
        request.state.request_id = request_id
        
        # Log incoming request
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"- Client: {request.client.host if request.client else 'unknown'}"
        )
        
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = f"{process_time:.4f}"
            response.headers["X-Request-ID"] = request_id
            
            logger.info(
                f"[{request_id}] {request.method} {request.url.path} "
                f"- Status: {response.status_code} - Time: {process_time:.4f}s"
            )
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} "
                f"- Error: {str(e)} - Time: {process_time:.4f}s"
            )
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory rate limiting middleware.
    For production, use Redis-based rate limiting.
    """
    
    def __init__(self, app: FastAPI, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_counts: dict = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks and static files
        if request.url.path in ("/health", "/docs", "/openapi.json"):
            return await call_next(request)
        
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean old entries
        self.request_counts[client_ip] = [
            ts for ts in self.request_counts[client_ip]
            if now - ts < self.window_seconds
        ]
        
        # Check rate limit
        if len(self.request_counts[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after": self.window_seconds,
                },
                headers={"Retry-After": str(self.window_seconds)},
            )
        
        self.request_counts[client_ip].append(now)
        return await call_next(request)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except Exception as e:
            logger.exception(f"Unhandled error: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "type": type(e).__name__,
                },
            )
