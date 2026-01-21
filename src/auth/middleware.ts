/**
 * Authentication Middleware
 * Provides authentication and authorization for API endpoints
 */

import type { APIRoute, APIContext } from 'astro';
import { verifyJWT, payloadToAuthContext } from './jwt';
import { hasPermission } from './permissions';
import { auditLog } from '../security/audit';
import type { AuthContext, Permission } from '../types/auth';

export type { AuthContext };

/**
 * Extract bearer token from request
 */
function extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
}

/**
 * Authenticate a request and return auth context
 */
export async function authenticate(request: Request): Promise<AuthContext | null> {
    const token = extractToken(request);
    if (!token) return null;

    const payload = verifyJWT(token);
    if (!payload) return null;

    return payloadToAuthContext(payload);
}

/**
 * Error response helper
 */
function errorResponse(status: number, error: string): Response {
    return new Response(JSON.stringify({ error }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Type for authenticated handler
 */
export type AuthenticatedHandler = (
    auth: AuthContext,
    context: APIContext
) => Promise<Response>;

/**
 * Require authentication middleware
 * Wraps an API route to require valid authentication
 */
export function requireAuth(handler: AuthenticatedHandler): APIRoute {
    return async (context: APIContext) => {
        const auth = await authenticate(context.request);

        if (!auth) {
            await auditLog({
                action: 'auth_failed',
                resource: context.url.pathname,
                success: false,
                metadata: {
                    reason: 'invalid_or_missing_token',
                    ip: context.request.headers.get('x-forwarded-for') || 'unknown'
                }
            });

            return errorResponse(401, 'Unauthorized: Valid authentication required');
        }

        // Log successful authentication
        await auditLog({
            action: 'auth_success',
            userId: auth.userId,
            resource: context.url.pathname,
            success: true
        });

        return handler(auth, context);
    };
}

/**
 * Require specific role(s) middleware
 * Wraps an API route to require specific role(s)
 */
export function requireRole(...requiredRoles: string[]): (handler: AuthenticatedHandler) => APIRoute {
    return (handler: AuthenticatedHandler): APIRoute => {
        return requireAuth(async (auth, context) => {
            const hasRequiredRole = requiredRoles.some(role => auth.roles.includes(role));

            if (!hasRequiredRole) {
                await auditLog({
                    action: 'authorization_failed',
                    userId: auth.userId,
                    resource: context.url.pathname,
                    success: false,
                    metadata: {
                        requiredRoles,
                        userRoles: auth.roles
                    }
                });

                return errorResponse(403, 'Forbidden: Insufficient role permissions');
            }

            return handler(auth, context);
        });
    };
}

/**
 * Require specific permission(s) middleware
 */
export function requirePermission(...requiredPermissions: Permission[]): (handler: AuthenticatedHandler) => APIRoute {
    return (handler: AuthenticatedHandler): APIRoute => {
        return requireAuth(async (auth, context) => {
            const hasAllPermissions = requiredPermissions.every(permission => 
                hasPermission(auth.roles, permission)
            );

            if (!hasAllPermissions) {
                await auditLog({
                    action: 'permission_denied',
                    userId: auth.userId,
                    resource: context.url.pathname,
                    success: false,
                    metadata: {
                        requiredPermissions,
                        userRoles: auth.roles
                    }
                });

                return errorResponse(403, 'Forbidden: Insufficient permissions');
            }

            return handler(auth, context);
        });
    };
}

/**
 * Optional authentication middleware
 * Allows both authenticated and unauthenticated requests
 */
export function optionalAuth(handler: (auth: AuthContext | null, context: APIContext) => Promise<Response>): APIRoute {
    return async (context: APIContext) => {
        const auth = await authenticate(context.request);
        return handler(auth, context);
    };
}

/**
 * Require project access middleware
 * Ensures user has access to the specified project
 */
export function requireProjectAccess(handler: AuthenticatedHandler): APIRoute {
    return requireAuth(async (auth, context) => {
        const projectId = context.params.projectId;

        // Admin has access to all projects
        if (auth.roles.includes('admin')) {
            return handler(auth, context);
        }

        // User must have project scope or be assigned to project
        if (auth.projectId && auth.projectId !== projectId) {
            await auditLog({
                action: 'project_access_denied',
                userId: auth.userId,
                resource: context.url.pathname,
                success: false,
                metadata: {
                    requestedProject: projectId,
                    userProject: auth.projectId
                }
            });

            return errorResponse(403, 'Forbidden: No access to this project');
        }

        return handler(auth, context);
    });
}
