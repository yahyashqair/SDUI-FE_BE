/**
 * Database Module Index
 * Unified entry point for all database operations
 */

import type Database from 'better-sqlite3';
import { getTenantDB } from './tenant';

export * from './platform';
export * from './tenant';
export * from './fs';
export * from './transaction';

// ============================================================================
// Database Manager
// ============================================================================

/**
 * Centralized database connection management
 * Provides connection pooling and lifecycle management
 */
export class DatabaseManager {
    private static instances: Map<string, Database.Database> = new Map();
    private static connectionCounts: Map<string, number> = new Map();

    /**
     * Get or create a tenant database connection
     */
    static getTenantDB(projectId: string): Database.Database {
        if (!this.instances.has(projectId)) {
            this.instances.set(projectId, getTenantDB(projectId));
            this.connectionCounts.set(projectId, 0);
        }
        
        // Track connection usage
        const count = this.connectionCounts.get(projectId) || 0;
        this.connectionCounts.set(projectId, count + 1);
        
        return this.instances.get(projectId)!;
    }

    /**
     * Close a specific tenant database connection
     */
    static closeTenantDB(projectId: string): boolean {
        const db = this.instances.get(projectId);
        if (db) {
            try {
                db.close();
                this.instances.delete(projectId);
                this.connectionCounts.delete(projectId);
                return true;
            } catch (e) {
                console.error(`Failed to close database for ${projectId}:`, e);
                return false;
            }
        }
        return false;
    }

    /**
     * Close all database connections
     */
    static closeAll(): void {
        for (const [projectId, db] of this.instances.entries()) {
            try {
                db.close();
            } catch (e) {
                console.error(`Failed to close database for ${projectId}:`, e);
            }
        }
        this.instances.clear();
        this.connectionCounts.clear();
    }

    /**
     * Get statistics about database connections
     */
    static getStats(): {
        activeConnections: number;
        connectionDetails: Array<{ projectId: string; useCount: number }>;
    } {
        const details = Array.from(this.connectionCounts.entries()).map(
            ([projectId, count]) => ({ projectId, useCount: count })
        );

        return {
            activeConnections: this.instances.size,
            connectionDetails: details
        };
    }

    /**
     * Check if a connection exists for a project
     */
    static hasConnection(projectId: string): boolean {
        return this.instances.has(projectId);
    }

    /**
     * Execute a function with a tenant database, ensuring proper cleanup
     */
    static async withTenantDB<T>(
        projectId: string,
        fn: (db: Database.Database) => T | Promise<T>
    ): Promise<T> {
        const db = this.getTenantDB(projectId);
        try {
            return await fn(db);
        } finally {
            // Optional: implement connection pooling logic here
        }
    }
}

// ============================================================================
// Cleanup on process exit
// ============================================================================

if (typeof process !== 'undefined') {
    process.on('beforeExit', () => {
        DatabaseManager.closeAll();
    });

    process.on('SIGINT', () => {
        DatabaseManager.closeAll();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        DatabaseManager.closeAll();
        process.exit(0);
    });
}
