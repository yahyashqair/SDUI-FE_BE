/**
 * JWT Token Utilities
 * Simple JWT implementation for authentication
 * In production, use a proper library like jose
 */

import crypto from 'crypto';
import type { JWTPayload, AuthContext } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-secret-change-in-production' : '');
const JWT_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
}

/**
 * Base64URL encode
 */
function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Create HMAC signature
 */
function createSignature(data: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Sign a JWT token
 */
export function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number = JWT_EXPIRY): string {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
        ...payload,
        iat: now,
        exp: now + expiresIn
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    const signature = createSignature(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const [encodedHeader, encodedPayload, signature] = parts;

        // Verify signature
        const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);
        if (!crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )) {
            return null;
        }

        // Decode payload
        const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

        // Check expiry
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

/**
 * Convert JWT payload to AuthContext
 */
export function payloadToAuthContext(payload: JWTPayload): AuthContext {
    return {
        userId: payload.sub,
        roles: payload.roles,
        projectId: payload.projectId,
        sessionId: payload.sessionId,
        expiresAt: payload.exp * 1000
    };
}

/**
 * Create a new session token
 */
export function createSessionToken(userId: string, roles: string[], projectId?: string): string {
    const sessionId = crypto.randomUUID();
    return signJWT({
        sub: userId,
        roles,
        projectId,
        sessionId
    });
}

/**
 * Refresh a token (extend expiry)
 */
export function refreshToken(token: string): string | null {
    const payload = verifyJWT(token);
    if (!payload) {
        return null;
    }

    return signJWT({
        sub: payload.sub,
        roles: payload.roles,
        projectId: payload.projectId,
        sessionId: payload.sessionId
    });
}
