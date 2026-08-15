# DDA Pharmacy API

All `/api/*` endpoints require an API key in the `X-API-Key` request header.

The `/` and `/docs` endpoints remain public.

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
export DDA_API_KEY='replace-with-a-long-random-secret'
python3 -m uvicorn app:app --reload
```

Open http://127.0.0.1:8000/docs

## Example request

```bash
curl -H "X-API-Key: YOUR_API_KEY"   "http://127.0.0.1:8000/api/pharmacies?district=Kathmandu&limit=50"
```

## Filters

`district`, `place`, `pranali`, `registration_no`, `pharmacy_name`, `search`, `page`, `limit`

Filters can be combined.
