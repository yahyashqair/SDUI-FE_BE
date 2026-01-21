/**
 * Role-Based Access Control (RBAC) Permissions
 * Handles permission checking for authenticated users
 */

import { ROLES, type Permission, type Role } from '../types/auth';

/**
 * Check if a set of roles grants a specific permission
 */
export function hasPermission(userRoles: string[], permission: Permission): boolean {
    // Admin has all permissions
    if (userRoles.includes('admin')) {
        return true;
    }

    for (const roleName of userRoles) {
        const role = ROLES[roleName];
        if (!role) continue;

        // Check for admin:full permission (grants all)
        if (role.permissions.includes('admin:full')) {
            return true;
        }

        // Check for specific permission
        if (role.permissions.includes(permission)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if a set of roles grants any of the specified permissions
 */
export function hasAnyPermission(userRoles: string[], permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(userRoles, permission));
}

/**
 * Check if a set of roles grants all of the specified permissions
 */
export function hasAllPermissions(userRoles: string[], permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(userRoles, permission));
}

/**
 * Get all permissions for a set of roles
 */
export function getAllPermissions(userRoles: string[]): Permission[] {
    const permissions = new Set<Permission>();

    for (const roleName of userRoles) {
        const role = ROLES[roleName];
        if (!role) continue;

        for (const permission of role.permissions) {
            permissions.add(permission);
        }
    }

    return Array.from(permissions);
}

/**
 * Check if user can perform action on resource
 * Maps common actions to permissions
 */
export function canPerformAction(
    userRoles: string[],
    resource: 'project' | 'mfe' | 'function' | 'release',
    action: 'read' | 'write' | 'delete' | 'deploy'
): boolean {
    const permission = `${resource}:${action}` as Permission;
    return hasPermission(userRoles, permission);
}

/**
 * Create a permission checker for a specific set of roles
 * Useful for caching permission checks
 */
export function createPermissionChecker(userRoles: string[]) {
    const cachedPermissions = getAllPermissions(userRoles);
    const isAdmin = userRoles.includes('admin');

    return {
        has: (permission: Permission): boolean => {
            if (isAdmin) return true;
            return cachedPermissions.includes(permission);
        },
        hasAny: (permissions: Permission[]): boolean => {
            if (isAdmin) return true;
            return permissions.some(p => cachedPermissions.includes(p));
        },
        hasAll: (permissions: Permission[]): boolean => {
            if (isAdmin) return true;
            return permissions.every(p => cachedPermissions.includes(p));
        },
        can: (resource: 'project' | 'mfe' | 'function' | 'release', action: 'read' | 'write' | 'delete' | 'deploy'): boolean => {
            if (isAdmin) return true;
            const permission = `${resource}:${action}` as Permission;
            return cachedPermissions.includes(permission);
        },
        all: cachedPermissions
    };
}
