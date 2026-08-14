const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const swaggerUi = require('swagger-ui-express');

const app = express();

const API_KEY = process.env.NMC_API_KEY;

const crypto = require('crypto');

console.log(
  'API key loaded:',
  !!API_KEY,
  'length:',
  API_KEY ? API_KEY.length : 0,
  'hash:',
  API_KEY
    ? crypto.createHash('sha256').update(API_KEY).digest('hex')
    : 'none'
);

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

const PORT = Number(process.env.NMC_PORT || process.env.PORT || 3000);

const db = new Database(path.join(__dirname, '..', 'database', 'nmc.sqlite'));

app.use(cors());
app.use(express.json());


// ======================================
// Swagger
// ======================================

const swaggerDocument = {

  openapi: '3.0.3',

  info: {
    title: 'NMC Doctor API',
    version: '1.0.0',
    description:
      'API for searching Nepal Medical Council doctor registration records.'
  },

  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  },

  servers: [
    {
      url: 'http://localhost:3000'
    }
  ],

  paths: {

    '/health': {

      get: {

        summary: 'API health check',

        responses: {
          200: {
            description: 'API is running'
          }
        }
      }
    },


    '/api/v1/doctors/{nmcNumber}': {

      get: {

        summary:
          'Get doctor by NMC number',

        security: [
          {
            ApiKeyAuth: []
          }
        ],

        parameters: [
          {
            name: 'nmcNumber',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],

        responses: {

          200: {
            description:
              'Doctor found'
          },

          404: {
            description:
              'Doctor not found'
          }
        }
      }
    },


    '/api/v1/doctors': {

      get: {

        summary:
          'Search doctors',

        security: [
          {
            ApiKeyAuth: []
          }
        ],

        parameters: [

          {
            name: 'name',
            in: 'query',
            schema: {
              type: 'string'
            }
          },

          {
            name: 'gender',
            in: 'query',
            schema: {
              type: 'string'
            }
          },

          {
            name: 'degree',
            in: 'query',
            schema: {
              type: 'string'
            }
          },

          {
            name: 'address',
            in: 'query',
            description: 'Search by doctor address/location',
            schema: {
              type: 'string'
            }
          },

          {
            name: 'page',
            in: 'query',
            schema: {
              type: 'integer',
              default: 1
            }
          },

          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 20,
              maximum: 100
            }
          }
        ],

        responses: {
          200: {
            description:
              'Search results'
          }
        }
      }
    },


    '/api/v1/stats': {

      get: {

        summary:
          'Database statistics',

        security: [
          {
            ApiKeyAuth: []
          }
        ],

        responses: {
          200: {
            description:
              'Database statistics'
          }
        }
      }
    }
  }
};

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);


// ======================================
// Health
// ======================================

app.get(
  '/health',
  (req, res) => {

    res.json({
      status: 'ok',
      service: 'nmc-doctor-api'
    });

  }
);


// ======================================
// Get doctor by NMC number
// ======================================

app.get(
  '/api/v1/doctors/:nmcNumber',
  requireApiKey,
  (req, res) => {

    const doctor =
      db.prepare(`
        SELECT
          nmc_number AS nmcNumber,
          name,
          address,
          gender,
          degree
        FROM doctors
        WHERE nmc_number = ?
      `).get(
        req.params.nmcNumber
      );

    if (!doctor) {

      return res.status(404).json({
        error: 'Doctor not found',
        nmcNumber:
          req.params.nmcNumber
      });

    }

    res.json(doctor);
  }
);


// ======================================
// Search doctors
// ======================================

app.get(
  '/api/v1/doctors',
  requireApiKey,
  (req, res) => {

    const {
      name,
      gender,
      degree,
      address,
      q
    } = req.query;

    let page =
      parseInt(req.query.page || '1');

    let limit =
      parseInt(req.query.limit || '20');

    page =
      Math.max(page, 1);

    limit =
      Math.min(
        Math.max(limit, 1),
        100
      );

    const offset =
      (page - 1) * limit;

    const conditions = [];
    const params = {};

    if (q) {
      conditions.push(
        '(name LIKE @q OR address LIKE @q OR degree LIKE @q OR CAST(nmc_number AS TEXT) LIKE @q)'
      );
      params.q = `%${q}%`;
    }

    if (name) {

      conditions.push(
        'name LIKE @name'
      );

      params.name =
        `%${name}%`;
    }

    if (gender) {

      conditions.push(
        'gender = @gender'
      );

      params.gender =
        gender;
    }

    if (degree) {

      conditions.push(
        'degree LIKE @degree'
      );

      params.degree =
        `%${degree}%`;
    }

    if (address) {

      conditions.push(
        'address LIKE @address'
      );

      params.address =
        `%${address}%`;
    }

    const where =
      conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const total =
      db.prepare(`
        SELECT COUNT(*) AS count
        FROM doctors
        ${where}
      `).get(params).count;

    const doctors =
      db.prepare(`
        SELECT
          nmc_number AS nmcNumber,
          name,
          address,
          gender,
          degree
        FROM doctors
        ${where}
        ORDER BY CAST(nmc_number AS INTEGER)
        LIMIT @limit
        OFFSET @offset
      `).all({
        ...params,
        limit,
        offset
      });

    res.json({

      data: doctors,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit
          )
      }

    });
  }
);


// ======================================
// Statistics
// ======================================

app.get(
  '/api/v1/stats',
  requireApiKey,
  (req, res) => {

    const total =
      db.prepare(`
        SELECT COUNT(*) AS count
        FROM doctors
      `).get().count;

    const gender =
      db.prepare(`
        SELECT
          gender,
          COUNT(*) AS count
        FROM doctors
        GROUP BY gender
      `).all();

    const degrees =
      db.prepare(`
        SELECT
          degree,
          COUNT(*) AS count
        FROM doctors
        GROUP BY degree
        ORDER BY count DESC
      `).all();

    res.json({
      total,
      gender,
      degrees
    });
  }
);


// ======================================
// Start
// ======================================

const server = app.listen(PORT, () => {
  console.log(`NMC API running on http://localhost:${PORT}`);
  console.log(`Documentation: http://localhost:${PORT}/docs`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`NMC API port ${PORT} is already in use. Stop the other process and retry.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});