import os
import tempfile
from typing import Any, Dict
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from swagger_ui import get_custom_swagger_html
from parser import UPPDFParser, process_events

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


@app.post("/parse", tags=["Parser"], summary="Parse a UP schedule PDF")
async def parse_schedule(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Parse a University of Pretoria schedule PDF and return extracted schedule data.
    """
    # 1. Validate file extension
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF files are accepted."
        )

    temp_file = None
    try:
        # 2. Save uploaded content to a temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )
            
        temp_file.write(content)
        temp_file.close()

        # 3. Instantiate the UP Parser and parse the document
        parser = UPPDFParser()
        result = parser.parse(temp_file.name)
        
        # 4. Process/Clean events
        processed_events = process_events(result['events'])

        return {
            "events": processed_events,
            "type": result['type']
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal parsing failure: {str(e)}"
        )
    finally:
        # 5. Ensure cleanup of the temporary file
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
