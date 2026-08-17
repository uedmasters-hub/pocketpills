import re
import unicodedata
from fastapi import FastAPI, Query, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from typing import Optional
import json
import os
from pathlib import Path

def normalize_search(text: str) -> str:
    s = unicodedata.normalize("NFKC", str(text or "")).casefold()
    s = re.sub(r"[^\w]+", " ", s, flags=re.UNICODE)
    return re.sub(r"\s+", " ", s).strip()


def compact_search(text: str) -> str:
    return normalize_search(text).replace(" ", "")


def matches_flexible(haystack: str, query: str) -> bool:
    needle = normalize_search(query)
    if not needle:
        return True
    hay = normalize_search(haystack)
    if not hay:
        return False
    if needle in hay:
        return True
    compact_hay = compact_search(hay)
    compact_needle = compact_search(needle)
    if compact_needle in compact_hay:
        return True
    hay_tokens = hay.split()
    return all(
        token in compact_hay
        or any(
            ht == token
            or ht.startswith(token)
            or (len(token) >= 3 and token in ht)
            for ht in hay_tokens
        )
        for token in needle.split()
    )

DATA_FILE = Path(__file__).parent / "pharmacies.json"

with DATA_FILE.open("r", encoding="utf-8") as f:
    RAW_PHARMACIES = json.load(f)

def is_veterinary(raw) -> bool:
    return bool(re.search(r"\bveterinar", str(raw or ""), flags=re.I))

PHARMACIES = [p for p in RAW_PHARMACIES if not is_veterinary(p.get("Pranali"))]

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

def public_pranali(raw) -> str:
    s = re.sub(r"\bHUMAN\b", "", str(raw or ""), flags=re.I)
    s = re.sub(r"\s*[-–—]\s*", " - ", s)
    return re.sub(r"\s+", " ", s).strip(" -")

def public_row(row: dict) -> dict:
    out = dict(row)
    if "Pranali" in out:
        out["Pranali"] = public_pranali(out.get("Pranali"))
    return out

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
    pranalis = sorted({public_pranali(p.get("Pranali")) for p in PHARMACIES if p.get("Pranali")})
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
        q = district
        results = [p for p in results if matches_flexible(str(p.get("District", "")), q)]
    if place:
        q = place
        results = [p for p in results if matches_flexible(str(p.get("Place", "")), q)]
    if pranali:
        q = pranali
        results = [p for p in results if matches_flexible(str(p.get("Pranali", "")), q)]
    if registration_no:
        results = [p for p in results if str(p.get("Registration No", "")) == registration_no]
    if pharmacy_name:
        q = pharmacy_name
        results = [p for p in results if matches_flexible(str(p.get("Pharmacy Name", "")), q)]
    if search:
        q = search
        results = [
            p for p in results
            if matches_flexible(
                " ".join(
                    [
                        str(p.get("Registration No", "")),
                        str(p.get("Pharmacy Name", "")),
                        str(p.get("Place", "")),
                        str(p.get("District", "")),
                        str(p.get("Pranali", "")),
                    ]
                ),
                q,
            )
        ]

    total = len(results)
    start = (page - 1) * limit
    end = start + limit
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "data": [public_row(p) for p in results[start:end]],
    }
