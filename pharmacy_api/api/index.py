from fastapi import FastAPI, Query, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from typing import Optional
import json
import os
from pathlib import Path

DATA_FILE = Path(__file__).parent / "pharmacies.json"

with DATA_FILE.open("r", encoding="utf-8") as f:
    PHARMACIES = json.load(f)

API_KEY = os.getenv("DDA_API_KEY")
if not API_KEY:
    raise RuntimeError("DDA_API_KEY is not set. Set it before starting the API.")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

app = FastAPI(
    title="DDA Pharmacy API",
    description="REST API for the cleaned DDA pharmacy dataset. /api/* endpoints require X-API-Key.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def require_api_key(api_key: Optional[str] = Depends(api_key_header)):
    if not api_key or api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return api_key

@app.get("/")
def root():
    return {
        "name": "DDA Pharmacy API",
        "version": "1.1.0",
        "records": len(PHARMACIES),
        "authentication": "X-API-Key required for /api/* endpoints",
        "docs": "/docs",
        "endpoints": {
            "pharmacies": "/api/pharmacies",
            "districts": "/api/districts",
            "stats": "/api/stats",
        },
    }

@app.get("/api/stats", dependencies=[Depends(require_api_key)])
def stats():
    districts = sorted({p.get("District") for p in PHARMACIES if p.get("District")})
    pranalis = sorted({p.get("Pranali") for p in PHARMACIES if p.get("Pranali")})
    return {"total": len(PHARMACIES), "districts": len(districts), "pranali": pranalis}

@app.get("/api/districts", dependencies=[Depends(require_api_key)])
def districts():
    counts = {}
    for p in PHARMACIES:
        d = p.get("District")
        if d:
            counts[d] = counts.get(d, 0) + 1
    return [{"district": d, "count": counts[d]} for d in sorted(counts)]

@app.get("/api/pharmacies", dependencies=[Depends(require_api_key)])
def pharmacies(
    district: Optional[str] = Query(None),
    place: Optional[str] = Query(None),
    pranali: Optional[str] = Query(None),
    registration_no: Optional[str] = Query(None),
    pharmacy_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
):
    results = PHARMACIES

    if district:
        q = district.casefold()
        results = [p for p in results if q in str(p.get("District", "")).casefold()]
    if place:
        q = place.casefold()
        results = [p for p in results if q in str(p.get("Place", "")).casefold()]
    if pranali:
        q = pranali.casefold()
        results = [p for p in results if q in str(p.get("Pranali", "")).casefold()]
    if registration_no:
        results = [p for p in results if str(p.get("Registration No", "")) == registration_no]
    if pharmacy_name:
        q = pharmacy_name.casefold()
        results = [p for p in results if q in str(p.get("Pharmacy Name", "")).casefold()]
    if search:
        q = search.casefold()
        results = [
            p for p in results
            if q in str(p.get("Registration No", "")).casefold()
            or q in str(p.get("Pharmacy Name", "")).casefold()
            or q in str(p.get("Place", "")).casefold()
            or q in str(p.get("District", "")).casefold()
            or q in str(p.get("Pranali", "")).casefold()
        ]

    total = len(results)
    start = (page - 1) * limit
    end = start + limit
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "data": results[start:end],
    }
