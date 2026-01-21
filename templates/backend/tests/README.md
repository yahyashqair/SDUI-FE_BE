# Backend Testing Templates

Testing guidelines and templates for backend functions.

## Test Setup

```bash
# Install dependencies
npm install --save-dev jest supertest

# Add test script to package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'functions/**/*.js',
    '!functions/**/*.test.js',
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
};
```

## Test Setup File

```javascript
// tests/setup.js
// Global test setup

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.JWT_SECRET = 'test-secret-key';

// Mock logger
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
```

## Database Test Helper

```javascript
// tests/db-helper.js
const { Pool } = require('pg');

class TestDatabase {
  constructor() {
    this.pool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'test_db',
      user: process.env.TEST_DB_USER || 'test_user',
      password: process.env.TEST_DB_PASSWORD || 'test_password',
    });
  }

  async connect() {
    await this.pool.connect();
  }

  async truncate(...tables) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const table of tables) {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async insert(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`);

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async disconnect() {
    await this.pool.end();
  }
}

module.exports = new TestDatabase();
```

## API Function Test Template

```javascript
// functions/api/__tests__/users.test.js
const { main } = require('../users');
const testDb = require('../../../tests/db-helper');

describe('Users API', () => {
  beforeEach(async () => {
    await testDb.connect();
    await testDb.truncate('users', 'refresh_tokens');
  });

  afterEach(async () => {
    await testDb.disconnect();
  });

  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      // Create test users
      await testDb.insert('users', {
        email: 'user1@example.com',
        name: 'User 1',
        password_hash: 'hash',
      });
      await testDb.insert('users', {
        email: 'user2@example.com',
        name: 'User 2',
        password_hash: 'hash',
      });

      const context = {
        method: 'GET',
        request: { url: 'http://test/api/users' },
        query: {},
        headers: {
          authorization: 'Bearer valid-admin-token',
        },
      };

      const response = await main(context);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.users).toHaveLength(2);
    });

    it('should paginate results', async () => {
      // Create 25 test users
      for (let i = 1; i <= 25; i++) {
        await testDb.insert('users', {
          email: `user${i}@example.com`,
          name: `User ${i}`,
          password_hash: 'hash',
        });
      }

      const context = {
        method: 'GET',
        request: { url: 'http://test/api/users?page=2&limit=10' },
        query: { page: '2', limit: '10' },
        headers: {
          authorization: 'Bearer valid-admin-token',
        },
      };

      const response = await main(context);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.users).toHaveLength(10);
      expect(body.data.pagination.page).toBe(2);
    });

    it('should require authentication', async () => {
      const context = {
        method: 'GET',
        request: { url: 'http://test/api/users' },
        query: {},
        headers: {},
      };

      const response = await main(context);

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID', async () => {
      const user = await testDb.insert('users', {
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
      });

      const context = {
        method: 'GET',
        request: { url: `http://test/api/users?id=${user.id}` },
        query: { id: user.id },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const response = await main(context);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const context = {
        method: 'GET',
        request: { url: 'http://test/api/users?id=00000000-0000-0000-0000-000000000000' },
        query: { id: '00000000-0000-0000-0000-000000000000' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const response = await main(context);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/users', () => {
    it('should create new user', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'securepassword123',
      };

      const context = {
        method: 'POST',
        request: { url: 'http://test/api/users' },
        query: {},
        headers: {
          authorization: 'Bearer valid-admin-token',
        },
        body: JSON.stringify(userData),
      };

      const response = await main(context);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.email).toBe('new@example.com');
      expect(body.data).not.toHaveProperty('password_hash');
    });

    it('should validate required fields', async () => {
      const userData = {
        email: 'invalid-email',
      };

      const context = {
        method: 'POST',
        request: { url: 'http://test/api/users' },
        query: {},
        headers: {
          authorization: 'Bearer valid-admin-token',
        },
        body: JSON.stringify(userData),
      };

      const response = await main(context);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should not allow duplicate emails', async () => {
      await testDb.insert('users', {
        email: 'existing@example.com',
        name: 'Existing User',
        password_hash: 'hash',
      });

      const userData = {
        email: 'existing@example.com',
        name: 'New User',
        password: 'password123',
      };

      const context = {
        method: 'POST',
        request: { url: 'http://test/api/users' },
        query: {},
        headers: {
          authorization: 'Bearer valid-admin-token',
        },
        body: JSON.stringify(userData),
      };

      const response = await main(context);

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('USER_EXISTS');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const user = await testDb.insert('users', {
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
      });

      const updateData = {
        name: 'Updated Name',
      };

      const context = {
        method: 'PUT',
        request: { url: `http://test/api/users?id=${user.id}` },
        query: { id: user.id },
        headers: {
          authorization: `Bearer user-token-${user.id}`,
        },
        body: JSON.stringify(updateData),
      };

      const response = await main(context);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.name).toBe('Updated Name');
    });

    it('should forbid updates from non-owners', async () => {
      const user = await testDb.insert('users', {
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
      });

      const updateData = {
        name: 'Hacked Name',
      };

      const context = {
        method: 'PUT',
        request: { url: `http://test/api/users?id=${user.id}` },
        query: { id: user.id },
        headers: {
          authorization: 'Bearer different-user-token',
        },
        body: JSON.stringify(updateData),
      };

      const response = await main(context);

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user (admin only)', async () => {
      const user = await testDb.insert('users', {
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
      });

      const context = {
        method: 'DELETE',
        request: { url: `http://test/api/users?id=${user.id}` },
        query: { id: user.id },
        headers: {
          authorization: 'Bearer valid-admin-token',
        },
      };

      const response = await main(context);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.message).toBe('User deleted successfully');
    });

    it('should forbid non-admin deletes', async () => {
      const user = await testDb.insert('users', {
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
      });

      const context = {
        method: 'DELETE',
        request: { url: `http://test/api/users?id=${user.id}` },
        query: { id: user.id },
        headers: {
          authorization: `Bearer user-token-${user.id}`,
        },
      };

      const response = await main(context);

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });
});
```

## Authentication Test Template

```javascript
// functions/gateway/__tests__/auth.test.js
const { main } = require('../auth');
const jwt = require('jsonwebtoken');

describe('Authentication Gateway', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  describe('Token Validation', () => {
    it('should allow valid token', async () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'user' },
        JWT_SECRET
      );

      const context = {
        request: { url: 'http://test/api/protected' },
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const result = await main(context);

      expect(result.headers['x-gateway-auth']).toBe('valid');
      expect(result.headers['x-user-id']).toBe('user-123');
    });

    it('should reject missing token', async () => {
      const context = {
        request: { url: 'http://test/api/protected' },
        headers: {},
      };

      const result = await main(context);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject invalid token format', async () => {
      const context = {
        request: { url: 'http://test/api/protected' },
        headers: {
          authorization: 'InvalidFormat token',
        },
      };

      const result = await main(context);

      expect(result.statusCode).toBe(401);
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const context = {
        request: { url: 'http://test/api/protected' },
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      };

      const result = await main(context);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error.message).toContain('expired');
    });
  });

  describe('Public Paths', () => {
    it('should skip auth for public paths', async () => {
      const context = {
        request: { url: 'http://test/api/auth/login' },
        headers: {},
      };

      const result = await main(context);

      expect(result.headers['x-gateway-auth']).toBe('skipped');
      expect(result.statusCode).toBeUndefined();
    });
  });

  describe('Role-Based Access', () => {
    it('should allow admin access to admin paths', async () => {
      const adminToken = jwt.sign(
        { userId: 'admin-123', role: 'admin' },
        JWT_SECRET
      );

      const context = {
        request: { url: 'http://test/api/admin/users' },
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      };

      const result = await main(context);

      expect(result.headers['x-gateway-auth']).toBe('valid');
    });

    it('should deny non-admin access to admin paths', async () => {
      const userToken = jwt.sign(
        { userId: 'user-123', role: 'user' },
        JWT_SECRET
      );

      const context = {
        request: { url: 'http://test/api/admin/users' },
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      };

      const result = await main(context);

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });
});
```

## Integration Test Template

```javascript
// tests/integration/api.integration.test.js
const request = require('supertest');
const { Pool } = require('pg');

describe('API Integration Tests', () => {
  let pool;
  let authToken;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.TEST_DB_HOST,
      database: process.env.TEST_DB_NAME,
      user: process.env.TEST_DB_USER,
    });

    // Setup test data
    await pool.query('TRUNCATE TABLE users CASCADE');

    // Create test user and get auth token
    const response = await request('http://localhost:3000')
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });

    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Authentication Flow', () => {
    it('should register new user', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'securepassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should login with valid credentials', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject protected route without token', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/users');

      expect(response.status).toBe(401);
    });
  });
});
```
