/**
 * Authentication Types
 * Type definitions for authentication and authorization
 */

export interface AuthContext {
    userId: string;
    roles: string[];
    projectId?: string;
    sessionId: string;
    expiresAt: number;
}

export interface JWTPayload {
    sub: string;
    roles: string[];
    projectId?: string;
    sessionId: string;
    iat: number;
    exp: number;
}

export interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Session {
    id: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
    ipAddress?: string;
    userAgent?: string;
}

export type Permission = 
    | 'project:read'
    | 'project:write'
    | 'project:delete'
    | 'mfe:read'
    | 'mfe:write'
    | 'mfe:delete'
    | 'function:read'
    | 'function:write'
    | 'function:delete'
    | 'release:read'
    | 'release:write'
    | 'release:deploy'
    | 'admin:full';

export interface Role {
    name: string;
    permissions: Permission[];
}

export const ROLES: Record<string, Role> = {
    admin: {
        name: 'admin',
        permissions: ['admin:full']
    },
    developer: {
        name: 'developer',
        permissions: [
            'project:read',
            'project:write',
            'mfe:read',
            'mfe:write',
            'function:read',
            'function:write',
            'release:read',
            'release:write'
        ]
    },
    viewer: {
        name: 'viewer',
        permissions: [
            'project:read',
            'mfe:read',
            'function:read',
            'release:read'
        ]
    },
    deployer: {
        name: 'deployer',
        permissions: [
            'project:read',
            'mfe:read',
            'function:read',
            'release:read',
            'release:deploy'
        ]
    }
};
