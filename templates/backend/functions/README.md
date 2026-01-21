# Functions Templates

Backend functions for the Fission serverless platform.

## Function Types

### API Functions (`functions/api/`)

Handle specific API routes and business logic.

### Gateway Functions (`functions/gateway/`)

Handle cross-cutting concerns like authentication, rate limiting, logging.

### Data Functions (`functions/data/`)

Handle database operations (future implementation).

## Base API Function Template

```javascript
/**
 * functions/api/resource-name.js
 *
 * @description Brief description of what this API does
 * @route GET /api/resource-name
 * @route POST /api/resource-name
 */

// Environment variables (injected by Fission)
const {
  DB_HOST = 'postgres.default.svc.cluster.local',
  DB_PORT = '5432',
  DB_NAME = 'app_db',
  DB_USER = 'app_user',
  JWT_SECRET = 'change-me-in-production',
} = process.env;

// Database connection (reuse if possible)
let dbPool = null;

function getPool() {
  if (!dbPool) {
    const { Pool } = require('pg');
    dbPool = new Pool({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      max: 20, // Connection pool size
      idleTimeoutMillis: 30000,
    });
  }
  return dbPool;
}

// Response helpers
function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }),
  };
}

function errorResponse(message, statusCode = 500, code = 'ERROR') {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        code,
      },
    }),
  };
}

// Validation helpers
function validateRequired(fields, data) {
  const missing = fields.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

// Main handler (Fission expects this export)
async function main(context) {
  const { method, request, query, headers } = context;
  const pool = getPool();

  try {
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        return await handleGet(context, pool);
      case 'POST':
        return await handlePost(context, pool);
      case 'PUT':
        return await handlePut(context, pool);
      case 'DELETE':
        return await handleDelete(context, pool);
      default:
        return errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
    }
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(error.message, 500, 'INTERNAL_ERROR');
  }
}

// GET handler
async function handleGet(context, pool) {
  const { query } = context;
  const { limit = 50, offset = 0 } = query;

  const result = await pool.query(
    'SELECT * FROM resources ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [Number(limit), Number(offset)]
  );

  return successResponse(result.rows);
}

// POST handler
async function handlePost(context, pool) {
  const { body } = context;
  const data = typeof body === 'string' ? JSON.parse(body) : body;

  // Validate input
  validateRequired(['name', 'value'], data);

  const result = await pool.query(
    'INSERT INTO resources (name, value) VALUES ($1, $2) RETURNING *',
    [data.name, data.value]
  );

  return successResponse(result.rows[0], 201);
}

// PUT handler
async function handlePut(context, pool) {
  const { query, body } = context;
  const { id } = query;
  const data = typeof body === 'string' ? JSON.parse(body) : body;

  if (!id) {
    return errorResponse('Missing id parameter', 400, 'MISSING_ID');
  }

  const result = await pool.query(
    'UPDATE resources SET name = $1, value = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [data.name, data.value, id]
  );

  if (result.rows.length === 0) {
    return errorResponse('Resource not found', 404, 'NOT_FOUND');
  }

  return successResponse(result.rows[0]);
}

// DELETE handler
async function handleDelete(context, pool) {
  const { query } = context;
  const { id } = query;

  if (!id) {
    return errorResponse('Missing id parameter', 400, 'MISSING_ID');
  }

  const result = await pool.query(
    'DELETE FROM resources WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    return errorResponse('Resource not found', 404, 'NOT_FOUND');
  }

  return successResponse({ message: 'Deleted successfully' });
}

module.exports = main;
```

## CORS Handling Template

```javascript
/**
 * functions/api/cors-enabled.js
 * API function with CORS support
 */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function handleOptions() {
  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: '',
  };
}

async function main(context) {
  const { method } = context;

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return handleOptions();
  }

  // Your actual handler logic
  // ...
}

module.exports = main;
```

## File Upload Template

```javascript
/**
 * functions/api/upload.js
 * Handle file uploads
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main(context) {
  const { method, headers, body } = context;

  if (method !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse multipart form data
    const contentType = headers['content-type'] || headers['Content-Type'];

    if (!contentType?.startsWith('multipart/form-data')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid content type' }),
      };
    }

    // Parse the form data (you may need a multipart parser)
    // This is a simplified example
    const boundary = contentType.match(/boundary=([^;]+)/)[1];

    // Extract file from multipart body
    const chunks = body.split(`--${boundary}`);
    const fileChunk = chunks.find((chunk) =>
      chunk.includes('Content-Disposition')
    );

    if (!fileChunk) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file found' }),
      };
    }

    // Extract file data and metadata
    const fileNameMatch = fileChunk.match(/filename="([^"]+)"/);
    const fileName = fileNameMatch ? fileNameMatch[1] : 'upload';
    const fileData = fileChunk.split('\r\n\r\n')[1]?.trim();

    // Generate unique filename
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const uniqueName = `${baseName}-${crypto.randomBytes(8).toString('hex')}${fileExt}`;

    // Save file (configure your storage path)
    const uploadPath = `/uploads/${uniqueName}`;
    // fs.writeFileSync(uploadPath, Buffer.from(fileData, 'binary'));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          fileName: uniqueName,
          originalName: fileName,
          size: fileData?.length || 0,
          url: `/files/${uniqueName}`,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
}

module.exports = main;
```

## Pagination Template

```javascript
/**
 * functions/api/paginated-list.js
 * API function with pagination support
 */

async function main(context) {
  const { query } = context;
  const pool = getPool();

  // Parse pagination params
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM resources'
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated data
  const dataResult = await pool.query(
    'SELECT * FROM resources ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }),
  };
}

module.exports = main;
```

## Search and Filter Template

```javascript
/**
 * functions/api/search.js
 * API function with search and filter capabilities
 */

async function main(context) {
  const { query } = context;
  const pool = getPool();

  const {
    q = '',           // Search query
    category,         // Filter by category
    status,           // Filter by status
    sortBy = 'created_at',
    sortOrder = 'DESC',
    limit = 50,
    offset = 0,
  } = query;

  // Build the base query
  let sql = 'SELECT * FROM resources WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  // Add search condition
  if (q) {
    sql += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    params.push(`%${q}%`);
    paramIndex++;
  }

  // Add filters
  if (category) {
    sql += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (status) {
    sql += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Add sorting
  const allowedSortFields = ['name', 'created_at', 'updated_at', 'category'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${sortField} ${order}`;

  // Add pagination
  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(sql, params);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: result.rows,
      meta: {
        search: q,
        filters: { category, status },
        sort: { field: sortField, order },
        pagination: { limit, offset },
      },
    }),
  };
}

module.exports = main;
```
