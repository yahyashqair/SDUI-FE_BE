/**
 * Session Management
 * Handles user session lifecycle
 */

import crypto from 'crypto';
import { signJWT, verifyJWT } from './jwt';
import type { Session, AuthContext } from '../types/auth';

// In-memory session store (use Redis/DB in production)
const sessions = new Map<string, Session>();

// Session configuration
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Create a new session
 */
export function createSession(
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
): Session {
    const session: Session = {
        id: crypto.randomUUID(),
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE).toISOString(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
    };

    sessions.set(session.id, session);
    return session;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): Session | null {
    const session = sessions.get(sessionId);
    if (!session) return null;

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
        sessions.delete(sessionId);
        return null;
    }

    return session;
}

/**
 * Validate a session
 */
export function validateSession(sessionId: string): boolean {
    return getSession(sessionId) !== null;
}

/**
 * Invalidate a session (logout)
 */
export function invalidateSession(sessionId: string): boolean {
    return sessions.delete(sessionId);
}

/**
 * Invalidate all sessions for a user
 */
export function invalidateAllUserSessions(userId: string): number {
    let count = 0;
    for (const [id, session] of sessions.entries()) {
        if (session.userId === userId) {
            sessions.delete(id);
            count++;
        }
    }
    return count;
}

/**
 * Extend session expiry
 */
export function extendSession(sessionId: string): Session | null {
    const session = getSession(sessionId);
    if (!session) return null;

    session.expiresAt = new Date(Date.now() + SESSION_MAX_AGE).toISOString();
    sessions.set(sessionId, session);
    return session;
}

/**
 * Get all active sessions for a user
 */
export function getUserSessions(userId: string): Session[] {
    const userSessions: Session[] = [];
    const now = new Date();

    for (const session of sessions.values()) {
        if (session.userId === userId && new Date(session.expiresAt) > now) {
            userSessions.push(session);
        }
    }

    return userSessions;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
    let count = 0;
    const now = new Date();

    for (const [id, session] of sessions.entries()) {
        if (new Date(session.expiresAt) < now) {
            sessions.delete(id);
            count++;
        }
    }

    return count;
}

/**
 * Get session statistics
 */
export function getSessionStats(): { total: number; active: number; expired: number } {
    const now = new Date();
    let active = 0;
    let expired = 0;

    for (const session of sessions.values()) {
        if (new Date(session.expiresAt) > now) {
            active++;
        } else {
            expired++;
        }
    }

    return {
        total: sessions.size,
        active,
        expired
    };
}

// Start periodic cleanup
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const cleaned = cleanupExpiredSessions();
        if (cleaned > 0) {
            console.log(`[Session] Cleaned up ${cleaned} expired sessions`);
        }
    }, SESSION_CLEANUP_INTERVAL);
}
