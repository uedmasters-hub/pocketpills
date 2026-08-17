require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.HF_API_KEY;

const facilities = require('../data/health-facilities.json');

function requireApiKey(req, res, next) {
  const key = req.get('X-API-Key');

  if (!API_KEY) {
    return res.status(500).json({
      error: 'API key is not configured'
    });
  }

  if (!key || key !== API_KEY) {
    return res.status(401).json({
      error: 'Invalid or missing API key'
    });
  }

  next();
}

function normalizeSearch(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesFlexible(haystack, query) {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  const hay = normalizeSearch(haystack);
  if (!hay) return false;
  if (hay.includes(needle)) return true;
  const compactHay = hay.replace(/\s+/g, "");
  const compactNeedle = needle.replace(/\s+/g, "");
  if (compactHay.includes(compactNeedle)) return true;
  const hayTokens = hay.split(" ").filter(Boolean);
  return needle.split(" ").filter(Boolean).every((token) => {
    if (compactHay.includes(token)) return true;
    return hayTokens.some(
      (h) =>
        h === token ||
        h.startsWith(token) ||
        (token.length >= 3 && h.includes(token)),
    );
  });
}

app.use(cors());
app.use(express.json());

const sortedFacilities = [...facilities].sort((a, b) =>
  a.hfCode.localeCompare(b.hfCode, undefined, { numeric: true })
);

const districtCounts = {};
const facilityLevelCounts = {};

for (const facility of facilities) {
  districtCounts[facility.district] =
    (districtCounts[facility.district] || 0) + 1;

  facilityLevelCounts[facility.facilityLevel] =
    (facilityLevelCounts[facility.facilityLevel] || 0) + 1;
}

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Health Facility API',
    version: '1.0.0',
    description:
      'API for searching simplified Nepal health-facility records.'
  },
  servers: [
    {
      url: '/'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'API health check',
        responses: {
          200: { description: 'API is running' }
        }
      }
    },

    '/api/v1/facilities/{hfCode}': {
      get: {
        summary: 'Get facility by HF code',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'hfCode',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'Facility found' },
          404: { description: 'Facility not found' }
        }
      }
    },

    '/api/v1/facilities': {
      get: {
        summary: 'Search health facilities',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'name',
            in: 'query',
            schema: { type: 'string' }
          },
          {
            name: 'district',
            in: 'query',
            schema: { type: 'string' }
          },
          {
            name: 'facilityLevel',
            in: 'query',
            schema: { type: 'string' }
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 }
          }
        ],
        responses: {
          200: { description: 'Search results' }
        }
      }
    },

    '/api/v1/stats': {
      get: {
        summary: 'Database statistics',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: { description: 'Database statistics' }
        }
      }
    }
  }
};

app.get('/', (req, res) => {
  res.json({
    service: 'health-facility-api',
    status: 'ok',
    docs: '/docs',
    health: '/health',
    totalFacilities: facilities.length
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'health-facility-api',
    totalFacilities: facilities.length
  });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/v1/facilities/:hfCode', requireApiKey, (req, res) => {
  const facility = facilities.find(
    item => item.hfCode === req.params.hfCode
  );

  if (!facility) {
    return res.status(404).json({
      error: 'Facility not found',
      hfCode: req.params.hfCode
    });
  }

  res.json(facility);
});

app.get('/api/v1/facilities', requireApiKey, (req, res) => {
  const { name, district, facilityLevel } = req.query;

  let page = parseInt(req.query.page || '1', 10);
  let limit = parseInt(req.query.limit || '20', 10);

  page = Number.isFinite(page) ? Math.max(page, 1) : 1;
  limit = Number.isFinite(limit)
    ? Math.min(Math.max(limit, 1), 100)
    : 20;

  const nameQuery = String(name || '').trim().toLowerCase();
  const districtQuery = String(district || '').trim().toLowerCase();
  const levelQuery = String(facilityLevel || '').trim().toLowerCase();

  const filtered = sortedFacilities.filter(facility => {
    if (
      nameQuery &&
      !matchesFlexible(`${facility.hfName} ${facility.district} ${facility.facilityLevel}`, nameQuery)
    ) {
      return false;
    }

    if (districtQuery && !matchesFlexible(facility.district, districtQuery)) {
      return false;
    }

    if (levelQuery && !matchesFlexible(facility.facilityLevel, levelQuery)) {
      return false;
    }

    return true;
  });

  const offset = (page - 1) * limit;

  res.json({
    data: filtered.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit)
    }
  });
});

app.get('/api/v1/stats', requireApiKey, (req, res) => {
  res.json({
    total: facilities.length,
    districts: Object.entries(districtCounts)
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count),
    facilityLevels: Object.entries(facilityLevelCounts)
      .map(([facilityLevel, count]) => ({ facilityLevel, count }))
      .sort((a, b) => b.count - a.count)
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Health Facility API running on http://localhost:${PORT}`
    );
    console.log(
      `Documentation: http://localhost:${PORT}/docs`
    );
  });
}

module.exports = app;
