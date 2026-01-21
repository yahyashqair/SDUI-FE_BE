# API Function Templates

API functions handle specific routes and resources.

## User Management API

```javascript
/**
 * functions/api/users.js
 * User CRUD operations
 *
 * Routes:
 *   GET    /api/users          - List users (paginated)
 *   GET    /api/users/:id      - Get user by ID
 *   POST   /api/users          - Create user
 *   PUT    /api/users/:id      - Update user
 *   DELETE /api/users/:id      - Delete user
 */

const { Pool } = require('pg');

// Environment variables
const {
  DB_HOST = 'postgres.default.svc.cluster.local',
  DB_PORT = '5432',
  DB_NAME = 'app_db',
  DB_USER = 'app_user',
} = process.env;

// Connection pool
const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  max: 20,
});

// Response helpers
function json(data, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

function error(message, status = 500, code = 'ERROR') {
  return json({
    success: false,
    error: { message, code },
  }, status);
}

function success(data, status = 200) {
  return json({
    success: true,
    data,
    meta: { timestamp: new Date().toISOString() },
  }, status);
}

// Routes based on HTTP method
async function main(context) {
  const { method, request, query, headers, body } = context;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  // Verify authentication
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return error('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.substring(7);
  const user = await verifyToken(token);
  if (!user) {
    return error('Invalid token', 401, 'INVALID_TOKEN');
  }

  try {
    switch (method) {
      case 'GET':
        return query.id ? getUser(context, pool) : getUsers(context, pool);

      case 'POST':
        return createUser(context, pool, user);

      case 'PUT':
        return updateUser(context, pool, user);

      case 'DELETE':
        return deleteUser(context, pool, user);

      default:
        return error('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
    }
  } catch (err) {
    console.error('Users API error:', err);
    return error(err.message, 500, 'INTERNAL_ERROR');
  }
}

// GET /api/users - List users
async function getUsers(context, pool) {
  const { query } = context;
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await pool.query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count);

  // Get users
  const result = await pool.query(
    `SELECT id, email, name, role, is_active, created_at, updated_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return success({
    users: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// GET /api/users/:id - Get user by ID
async function getUser(context, pool) {
  const { query } = context;
  const { id } = query;

  if (!id) {
    return error('Missing user ID', 400, 'MISSING_ID');
  }

  const result = await pool.query(
    `SELECT id, email, name, role, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return error('User not found', 404, 'NOT_FOUND');
  }

  return success(result.rows[0]);
}

// POST /api/users - Create user
async function createUser(context, pool, currentUser) {
  const { body } = context;
  const data = typeof body === 'string' ? JSON.parse(body) : body;

  // Validate input
  if (!data.email || !data.name || !data.password) {
    return error('Missing required fields: email, name, password', 400, 'VALIDATION_ERROR');
  }

  // Check if user exists
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [data.email]
  );

  if (existing.rows.length > 0) {
    return error('User already exists', 409, 'USER_EXISTS');
  }

  // Hash password (use bcrypt in production)
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Insert user
  const result = await pool.query(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, role, is_active, created_at`,
    [data.email, data.name, hashedPassword, data.role || 'user']
  );

  return success(result.rows[0], 201);
}

// PUT /api/users/:id - Update user
async function updateUser(context, pool, currentUser) {
  const { query, body } = context;
  const { id } = query;
  const data = typeof body === 'string' ? JSON.parse(body) : body;

  if (!id) {
    return error('Missing user ID', 400, 'MISSING_ID');
  }

  // Check permissions
  if (id !== currentUser.id && currentUser.role !== 'admin') {
    return error('Forbidden', 403, 'FORBIDDEN');
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (data.name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }

  if (data.email) {
    updates.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }

  if (data.role && currentUser.role === 'admin') {
    updates.push(`role = $${paramIndex++}`);
    values.push(data.role);
  }

  if (updates.length === 0) {
    return error('No fields to update', 400, 'NO_UPDATE');
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE users
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING id, email, name, role, is_active, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    return error('User not found', 404, 'NOT_FOUND');
  }

  return success(result.rows[0]);
}

// DELETE /api/users/:id - Delete user
async function deleteUser(context, pool, currentUser) {
  const { query } = context;
  const { id } = query;

  if (!id) {
    return error('Missing user ID', 400, 'MISSING_ID');
  }

  // Only admins can delete
  if (currentUser.role !== 'admin') {
    return error('Forbidden', 403, 'FORBIDDEN');
  }

  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    return error('User not found', 404, 'NOT_FOUND');
  }

  return success({ message: 'User deleted successfully' });
}

// JWT verification helper
async function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET = 'secret' } = process.env;
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = main;
```

## Authentication API

```javascript
/**
 * functions/api/auth.js
 * Authentication endpoints
 *
 * Routes:
 *   POST /api/auth/register - Register new user
 *   POST /api/auth/login    - Login user
 *   POST /api/auth/logout   - Logout user
 *   POST /api/auth/refresh  - Refresh access token
 *   GET  /api/auth/verify   - Verify token validity
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres.default.svc.cluster.local',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'app_db',
  user: process.env.DB_USER || 'app_user',
});

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = '1h';
const REFRESH_EXPIRES_IN = '7d';

function json(data, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

function error(message, status = 500, code = 'ERROR') {
  return json({
    success: false,
    error: { message, code },
  }, status);
}

function success(data, status = 200) {
  return json({
    success: true,
    data,
  }, status);
}

async function main(context) {
  const { method, request, headers, body } = context;

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/auth', '') || '/';

    switch (path) {
      case '/register':
        return await handleRegister(context, pool);
      case '/login':
        return await handleLogin(context, pool);
      case '/logout':
        return await handleLogout(context, pool);
      case '/refresh':
        return await handleRefresh(context, pool);
      case '/verify':
        return await handleVerify(context, pool);
      default:
        return error('Not found', 404, 'NOT_FOUND');
    }
  } catch (err) {
    console.error('Auth API error:', err);
    return error(err.message, 500, 'INTERNAL_ERROR');
  }
}

// POST /api/auth/register
async function handleRegister(context, pool) {
  const { body } = context;
  const data = typeof body === 'string' ? JSON.parse(body) : body;

  // Validate
  if (!data.email || !data.password || !data.name) {
    return error('Missing required fields', 400, 'VALIDATION_ERROR');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return error('Invalid email address', 400, 'INVALID_EMAIL');
  }

  // Password validation
  if (data.password.length < 8) {
    return error('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');
  }

  // Check existing user
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [data.email]
  );

  if (existing.rows.length > 0) {
    return error('User already exists', 409, 'USER_EXISTS');
  }

  // Create user
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const result = await pool.query(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at`,
    [data.email, data.name, hashedPassword]
  );

  const user = result.rows[0];

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  // Store refresh token
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, refreshToken]
  );

  return success({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  }, 201);
}

// POST /api/auth/login
async function handleLogin(context, pool) {
  const { body } = context;
  const data = typeof body === 'string' ? JSON.parse(body) : data;

  if (!data.email || !data.password) {
    return error('Missing email or password', 400, 'VALIDATION_ERROR');
  }

  // Find user
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [data.email]
  );

  if (result.rows.length === 0) {
    return error('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const user = result.rows[0];

  // Verify password
  const validPassword = await bcrypt.compare(data.password, user.password_hash);
  if (!validPassword) {
    return error('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check if user is active
  if (!user.is_active) {
    return error('Account is disabled', 403, 'ACCOUNT_DISABLED');
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  // Update last login
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  return success({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
}

// POST /api/auth/logout
async function handleLogout(context, pool) {
  const { headers, body } = context;
  const data = typeof body === 'string' ? JSON.parse(body) : body;

  if (data.refreshToken) {
    // Remove refresh token from database
    await pool.query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [data.refreshToken]
    );
  }

  return success({ message: 'Logged out successfully' });
}

// POST /api/auth/refresh
async function handleRefresh(context, pool) {
  const { body } = context;
  const data = typeof body === 'string' ? JSON.parse(body) : data;

  if (!data.refreshToken) {
    return error('Missing refresh token', 400, 'MISSING_TOKEN');
  }

  try {
    const decoded = jwt.verify(data.refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return error('Invalid token type', 401, 'INVALID_TOKEN');
    }

    // Check if token exists in database
    const tokenResult = await pool.query(
      `SELECT rt.*, u.id, u.email, u.name, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [data.refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return error('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    }

    const user = tokenResult.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return success({ accessToken });
  } catch (err) {
    return error('Invalid refresh token', 401, 'INVALID_TOKEN');
  }
}

// GET /api/auth/verify
async function handleVerify(context, pool) {
  const { headers } = context;
  const authHeader = headers['authorization'] || headers['Authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return error('Missing authorization header', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user details
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return error('User not found', 404, 'USER_NOT_FOUND');
    }

    return success({
      valid: true,
      user: result.rows[0],
    });
  } catch (err) {
    return error('Invalid token', 401, 'INVALID_TOKEN');
  }
}

module.exports = main;
```

## Data Export API

```javascript
/**
 * functions/api/export.js
 * Export data in various formats
 */

async function main(context) {
  const { query, headers } = context;
  const pool = getPool();

  const { format = 'json', resource = 'users' } = query;

  // Get data
  let data;
  switch (resource) {
    case 'users':
      data = (await pool.query('SELECT * FROM users')).rows;
      break;
    case 'posts':
      data = (await pool.query('SELECT * FROM posts')).rows;
      break;
    default:
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid resource' }),
      };
  }

  // Format response
  switch (format) {
    case 'csv':
      const csv = convertToCSV(data);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${resource}.csv"`,
        },
        body: csv,
      };

    case 'json':
    default:
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${resource}.json"`,
        },
        body: JSON.stringify(data, null, 2),
      };
  }
}

function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

module.exports = main;
```
