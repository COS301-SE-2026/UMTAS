from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from prometheus_fastapi_instrumentator import Instrumentator

from swagger_ui import get_custom_swagger_html

app = FastAPI(
    title="UMTAS PDF Parser",
    description="University Management Timetable & Scheduling System - PDF Parser Service",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"])
Instrumentator().instrument(app).expose(app)


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui() -> HTMLResponse:
    return get_custom_swagger_html(openapi_url="/openapi.json", title="UMTAS PDF Parser")


@app.get("/brand/vigil-owl.png", include_in_schema=False)
async def brand_vigil() -> FileResponse:
    return FileResponse("static/brand/vigil-owl.png", media_type="image/png")


@app.get("/brand/umtas-logo.png", include_in_schema=False)
async def brand_umtas() -> FileResponse:
    return FileResponse("static/brand/umtas-logo.png", media_type="image/png")


@app.get("/brand/dns-logo.png", include_in_schema=False)
async def brand_dns() -> FileResponse:
    return FileResponse("static/brand/dns-logo.png", media_type="image/png")


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok", "service": "pdf_parser"}


@app.get("/health", tags=["Health"], summary="Service health check")
async def health() -> dict[str, str]:
    return {"status": "ok"}
