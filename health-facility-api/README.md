# Health Facility API — Vercel Ready

Read-only API built from the simplified health-facility dataset.

## Dataset

11,687 facilities.

Fields:
- hfCode
- hfName
- district
- facilityLevel

## Why this version uses JSON

This API is read-only. The dataset is bundled as a JSON file so it does not depend on a writable local SQLite filesystem. This is better suited to Vercel Functions.

## Local

```bash
npm install
cp .env.example .env
# set HF_API_KEY
npm start
```

API:
http://localhost:3001

Swagger:
http://localhost:3001/docs

## Vercel

Install CLI:

```bash
npm i -g vercel
```

Login:

```bash
vercel login
```

Preview:

```bash
vercel
```

Production:

```bash
vercel --prod
```

Set `HF_API_KEY` in Vercel Project Settings → Environment Variables before production deployment.

## Endpoints

GET /health
GET /docs
GET /api/v1/facilities/:hfCode
GET /api/v1/facilities?name=&district=&facilityLevel=&page=&limit=
GET /api/v1/stats

Protected endpoints require:

X-API-Key: YOUR_KEY
