# Gateway Function Templates

Gateway functions handle cross-cutting concerns like authentication, rate limiting, logging.

## Authentication Gateway

```javascript
/**
 * functions/gateway/auth.js
 * Authentication and authorization gateway
 *
 * Validates JWT tokens and injects user context into requests
 */

const jwt = require('jsonwebtoken');

// Configuration
const {
  JWT_SECRET = 'your-secret-key-change-in-production',
  JWT_ALGORITHM = 'HS256',
} = process.env;

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
  '/api/public',
];

// Paths that require admin role
const ADMIN_PATHS = [
  '/api/admin',
];

/**
 * Main gateway function
 */
async function main(context) {
  const { request, headers } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip auth for public paths
  if (isPublicPath(pathname)) {
    return {
      ...context,
      headers: {
        ...headers,
        'x-gateway-auth': 'skipped',
      },
    };
  }

  // Get authorization header
  const authHeader = headers['authorization'] || headers['Authorization'];

  if (!authHeader) {
    return unauthorized('Missing authorization header');
  }

  if (!authHeader.startsWith('Bearer ')) {
    return unauthorized('Invalid authorization format');
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    // Check if admin path
    if (isAdminPath(pathname) && decoded.role !== 'admin') {
      return forbidden('Admin access required');
    }

    // Inject user context into headers
    return {
      ...context,
      headers: {
        ...headers,
        'x-user-id': decoded.userId || decoded.id,
        'x-user-email': decoded.email,
        'x-user-role': decoded.role,
        'x-gateway-auth': 'valid',
      },
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorized('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return unauthorized('Invalid token');
    }
    return unauthorized('Authentication failed');
  }
}

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function isAdminPath(pathname) {
  return ADMIN_PATHS.some((path) => pathname.startsWith(path));
}

function unauthorized(message) {
  return {
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        code: 'UNAUTHORIZED',
      },
    }),
  };
}

function forbidden(message) {
  return {
    statusCode: 403,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        code: 'FORBIDDEN',
      },
    }),
  };
}

module.exports = main;
```

## Rate Limiting Gateway

```javascript
/**
 * functions/gateway/rate-limit.js
 * Rate limiting gateway using Redis or in-memory storage
 *
 * Configuration via environment variables:
 * - RATE_LIMIT_WINDOW: Time window in seconds (default: 60)
 * - RATE_LIMIT_MAX: Max requests per window (default: 100)
 * - REDIS_HOST: Redis host (optional, for distributed rate limiting)
 */

// Simple in-memory store (for single-instance deployment)
const memoryStore = new Map();

// For production with Redis:
// let redisClient = null;
// if (process.env.REDIS_HOST) {
//   const redis = require('redis');
//   redisClient = redis.createClient({
//     host: process.env.REDIS_HOST,
//     port: process.env.REDIS_PORT || 6379,
//   });
// }

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '60') * 1000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '100');

/**
 * Main rate limiting function
 */
async function main(context) {
  const { request, headers } = context;
  const url = new URL(request.url);

  // Get client identifier (IP address or user ID)
  const clientId = getClientId(context);

  // Get rate limit key (include path for per-endpoint limits)
  const key = `ratelimit:${clientId}:${url.pathname}`;

  // Check rate limit
  const { allowed, remaining, reset } = await checkRateLimit(key);

  // Add rate limit headers
  const rateLimitHeaders = {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  };

  if (!allowed) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        ...rateLimitHeaders,
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
      }),
    };
  }

  // Allow request to proceed
  return {
    ...context,
    headers: {
      ...headers,
      ...rateLimitHeaders,
    },
  };
}

function getClientId(context) {
  // Use user ID if authenticated, otherwise use IP
  const userId = context.headers['x-user-id'];
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP address from various possible headers
  const ip =
    context.headers['x-forwarded-for']?.split(',')[0] ||
    context.headers['x-real-ip'] ||
    context.request?.socket?.remoteAddress ||
    'unknown';

  return `ip:${ip}`;
}

async function checkRateLimit(key) {
  const now = Date.now();
  const windowStart = now - (now % WINDOW_MS);

  // Using memory store
  const record = memoryStore.get(key);

  if (!record || record.window !== windowStart) {
    // New window
    memoryStore.set(key, {
      window: windowStart,
      count: 1,
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      reset: windowStart + WINDOW_MS,
    };
  }

  if (record.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      reset: windowStart + WINDOW_MS,
    };
  }

  // Increment counter
  record.count++;

  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.count,
    reset: windowStart + WINDOW_MS,
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowStart = now - (now % WINDOW_MS);

  for (const [key, record] of memoryStore.entries()) {
    if (record.window < windowStart) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

module.exports = main;
```

## CORS Gateway

```javascript
/**
 * functions/gateway/cors.js
 * CORS handling gateway
 */

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:4321'];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
];

const MAX_AGE = 86400; // 24 hours

async function main(context) {
  const { request, headers, method } = context;
  const origin = headers['origin'] || headers['Origin'];

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return handlePreflight(origin);
  }

  // Add CORS headers to all responses
  const corsHeaders = getCorsHeaders(origin);

  return {
    ...context,
    headers: {
      ...headers,
      ...corsHeaders,
    },
  };
}

function handlePreflight(origin) {
  const corsHeaders = getCorsHeaders(origin);

  // Add preflight-specific headers
  corsHeaders['Access-Control-Allow-Methods'] = ALLOWED_METHODS.join(', ');
  corsHeaders['Access-Control-Allow-Headers'] = ALLOWED_HEADERS.join(', ');
  corsHeaders['Access-Control-Max-Age'] = String(MAX_AGE);

  // Check if request has custom headers
  const requestHeaders = context.headers['access-control-request-headers'];
  if (requestHeaders) {
    corsHeaders['Access-Control-Allow-Headers'] = requestHeaders;
  }

  // Check for request method
  const requestMethod = context.headers['access-control-request-method'];
  if (requestMethod && !ALLOWED_METHODS.includes(requestMethod)) {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
      }),
    };
  }

  return {
    statusCode: 204,
    headers: corsHeaders,
    body: '',
  };
}

function getCorsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
  };

  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    // For requests without origin (same-origin) or disallowed origins
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0];
  }

  // Expose headers that client can read
  headers['Access-Control-Expose-Headers'] = [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ].join(', ');

  return headers;
}

function isOriginAllowed(origin) {
  if (!origin) return true; // Same-origin request

  return ALLOWED_ORIGINS.some((allowed) => {
    // Exact match
    if (allowed === origin) return true;

    // Wildcard match
    if (allowed === '*') return true;

    // Domain wildcard (*.example.com)
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      return origin.endsWith(domain);
    }

    return false;
  });
}

module.exports = main;
```

## Logging Gateway

```javascript
/**
 * functions/gateway/logger.js
 * Request/response logging gateway
 */

const { v4: uuidv4 } = require('uuid');

// Log levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// Current log level (from env or default to INFO)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const LOG_LEVEL_PRIORITY = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

async function main(context) {
  const { request, headers, method } = context;

  // Generate request ID
  const requestId = uuidv4();

  // Add request ID to headers
  const enhancedHeaders = {
    ...headers,
    'x-request-id': requestId,
  };

  // Log incoming request
  logRequest({
    requestId,
    method,
    url: request.url,
    headers: sanitizeHeaders(headers),
    userAgent: headers['user-agent'],
    ip: getClientIP(context),
  });

  // Store start time
  const startTime = Date.now();

  // Return enhanced context
  return {
    ...context,
    headers: enhancedHeaders,
    _logger: {
      requestId,
      startTime,
    },
  };
}

function logRequest(data) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'request',
    ...data,
  };

  console.log(JSON.stringify(log));
}

function logResponse(requestId, statusCode, duration) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'response',
    requestId,
    statusCode,
    duration,
  };

  console.log(JSON.stringify(log));
}

function logError(requestId, error) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'error',
    requestId,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    level: LOG_LEVELS.ERROR,
  };

  console.error(JSON.stringify(log));
}

function sanitizeHeaders(headers) {
  const sanitized = { ...headers };

  // Remove sensitive headers
  const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];
  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

function getClientIP(context) {
  return (
    context.headers['x-forwarded-for']?.split(',')[0] ||
    context.headers['x-real-ip'] ||
    context.request?.socket?.remoteAddress ||
    'unknown'
  );
}

// Helper to determine if a log should be output
function shouldLog(level) {
  return (
    LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL.toLowerCase()]
  );
}

// Export log functions for use in other modules
module.exports = {
  main,
  logRequest,
  logResponse,
  logError,
  shouldLog,
  LOG_LEVELS,
};
```

## Request Validation Gateway

```javascript
/**
 * functions/gateway/validation.js
 * Request validation gateway using schemas
 */

const { validationResult } = require('express-validator');

// Validation schemas
const schemas = {
  'users:create': [
    body('email').isEmail().withMessage('Invalid email'),
    body('name').isLength({ min: 2 }).withMessage('Name too short'),
    body('password').isLength({ min: 8 }).withMessage('Password too short'),
  ],

  'auth:login': [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password required'),
  ],

  'posts:create': [
    body('title').isLength({ min: 5, max: 200 }).withMessage('Invalid title length'),
    body('content').isLength({ min: 10 }).withMessage('Content too short'),
    body('category').optional().isIn(['tech', 'news', 'tutorial']).withMessage('Invalid category'),
  ],
};

async function main(context) {
  const { request, body } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = context.method?.toLowerCase() || 'get';

  // Determine schema key
  const schemaKey = getSchemaKey(pathname, method);

  if (!schemaKey || !schemas[schemaKey]) {
    // No validation schema for this route
    return context;
  }

  // Run validation
  const schema = schemas[schemaKey];
  const data = typeof body === 'string' ? JSON.parse(body) : body;

  const errors = [];

  for (const validation of schema) {
    // Simplified validation (use express-validator in production)
    const field = validation.field;
    const value = data[field];

    if (validation.optional && value === undefined) {
      continue;
    }

    if (validation.required && value === undefined) {
      errors.push({
        field,
        message: `${field} is required`,
      });
      continue;
    }

    // Run validation
    try {
      if (validation.validator) {
        const valid = await validation.validator(value);
        if (!valid) {
          errors.push({
            field,
            message: validation.message || `Invalid ${field}`,
          });
        }
      }
    } catch (err) {
      errors.push({
        field,
        message: err.message,
      });
    }
  }

  if (errors.length > 0) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      }),
    };
  }

  return context;
}

function getSchemaKey(pathname, method) {
  // Convert pathname to schema key format
  // e.g., /api/users -> users:create (for POST)
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const resource = parts[1]; // 'users', 'posts', etc.
  const action = method === 'post' ? 'create' : method === 'put' ? 'update' : method;

  return `${resource}:${action}`;
}

// Helper to create validation rules
function body(field) {
  return {
    field,
    optional: false,
    required: false,
    validator: null,
    message: null,

    isEmail() {
      this.validator = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      this.message = 'Invalid email format';
      return this;
    },

    isLength({ min, max }) {
      this.validator = (value) =>
        (!min || value.length >= min) && (!max || value.length <= max);
      this.message = `Length must be between ${min} and ${max}`;
      return this;
    },

    isIn(allowed) {
      this.validator = (value) => allowed.includes(value);
      this.message = `Must be one of: ${allowed.join(', ')}`;
      return this;
    },

    notEmpty() {
      this.required = true;
      this.validator = (value) => value !== undefined && value !== null && value !== '';
      this.message = 'Field is required';
      return this;
    },

    optional() {
      this.optional = true;
      return this;
    },
  };
}

module.exports = {
  main,
  schemas,
  body,
};
```
