/**
 * Auth Gateway Function
 * Handles authentication and token validation
 * 
 * HTTP Trigger: POST /api/auth/login, GET /api/auth/verify
 */

const crypto = require('crypto');

// In production, use proper JWT library and secure secret management
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * Simple JWT-like token generation (use jsonwebtoken in production)
 */
function createToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    })).toString('base64url');

    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');

    return `${header}.${body}.${signature}`;
}

/**
 * Verify token
 */
function verifyToken(token) {
    try {
        const [header, body, signature] = token.split('.');

        const expectedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(`${header}.${body}`)
            .digest('base64url');

        if (signature !== expectedSignature) {
            return { valid: false, error: 'Invalid signature' };
        }

        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());

        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return { valid: false, error: 'Token expired' };
        }

        return { valid: true, payload };
    } catch (e) {
        return { valid: false, error: 'Invalid token format' };
    }
}

module.exports = async function (context) {
    const method = context.request.method;

    // POST - Login (Fission routes to / so we use method-based routing)
    if (method === 'POST') {
        const { username, password } = context.request.body || {};

        // Demo: accept any user (replace with real DB validation)
        if (!username || !password) {
            return {
                status: 400,
                body: { error: 'Username and password required' },
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // Create token
        const token = createToken({
            sub: username,
            role: 'user'
        });

        return {
            status: 200,
            body: {
                success: true,
                token,
                user: { username, role: 'user' }
            },
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // GET - Verify token
    if (method === 'GET') {
        const authHeader = context.request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                status: 401,
                body: { error: 'No token provided' },
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const token = authHeader.substring(7);
        const result = verifyToken(token);

        if (!result.valid) {
            return {
                status: 401,
                body: { error: result.error },
                headers: { 'Content-Type': 'application/json' }
            };
        }

        return {
            status: 200,
            body: {
                valid: true,
                user: result.payload
            },
            headers: { 'Content-Type': 'application/json' }
        };
    }

    return {
        status: 404,
        body: { error: 'Endpoint not found' },
        headers: { 'Content-Type': 'application/json' }
    };
};
