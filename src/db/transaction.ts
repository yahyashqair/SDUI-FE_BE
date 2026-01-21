/**
 * Database Transaction Management
 * Provides transaction support for SQLite operations
 */

import type Database from 'better-sqlite3';

// ============================================================================
// Transaction Class
// ============================================================================

export class Transaction {
    private db: Database.Database;
    private isActive: boolean = false;

    constructor(db: Database.Database) {
        this.db = db;
    }

    /**
     * Begin a transaction
     */
    begin(): void {
        if (this.isActive) {
            throw new Error('Transaction already active');
        }
        this.db.exec('BEGIN TRANSACTION');
        this.isActive = true;
    }

    /**
     * Commit the transaction
     */
    commit(): void {
        if (!this.isActive) {
            throw new Error('No active transaction to commit');
        }
        this.db.exec('COMMIT');
        this.isActive = false;
    }

    /**
     * Rollback the transaction
     */
    rollback(): void {
        if (!this.isActive) {
            // Silent return if no active transaction
            return;
        }
        this.db.exec('ROLLBACK');
        this.isActive = false;
    }

    /**
     * Check if transaction is active
     */
    get active(): boolean {
        return this.isActive;
    }

    /**
     * Run a function within a transaction
     * Automatically commits on success, rolls back on failure
     */
    run<T>(fn: () => T): T {
        this.begin();
        try {
            const result = fn();
            this.commit();
            return result;
        } catch (e) {
            this.rollback();
            throw e;
        }
    }

    /**
     * Run an async function within a transaction
     */
    async runAsync<T>(fn: () => Promise<T>): Promise<T> {
        this.begin();
        try {
            const result = await fn();
            this.commit();
            return result;
        } catch (e) {
            this.rollback();
            throw e;
        }
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Run a function within a transaction
 * Creates a new Transaction instance
 */
export function withTransaction<T>(
    db: Database.Database,
    fn: () => T
): T {
    const tx = new Transaction(db);
    return tx.run(fn);
}

/**
 * Run an async function within a transaction
 */
export async function withTransactionAsync<T>(
    db: Database.Database,
    fn: () => Promise<T>
): Promise<T> {
    const tx = new Transaction(db);
    return tx.runAsync(fn);
}

/**
 * Create a savepoint within a transaction
 */
export function createSavepoint(db: Database.Database, name: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error('Invalid savepoint name');
    }
    db.exec(`SAVEPOINT ${name}`);
}

/**
 * Release a savepoint
 */
export function releaseSavepoint(db: Database.Database, name: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error('Invalid savepoint name');
    }
    db.exec(`RELEASE SAVEPOINT ${name}`);
}

/**
 * Rollback to a savepoint
 */
export function rollbackToSavepoint(db: Database.Database, name: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error('Invalid savepoint name');
    }
    db.exec(`ROLLBACK TO SAVEPOINT ${name}`);
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Execute multiple statements in a transaction
 */
export function executeBatch(
    db: Database.Database,
    statements: Array<{ sql: string; params?: unknown[] }>
): void {
    withTransaction(db, () => {
        for (const { sql, params } of statements) {
            const stmt = db.prepare(sql);
            if (params) {
                stmt.run(...params);
            } else {
                stmt.run();
            }
        }
    });
}

/**
 * Insert multiple rows efficiently
 */
export function insertMany<T extends Record<string, unknown>>(
    db: Database.Database,
    tableName: string,
    rows: T[]
): number {
    if (rows.length === 0) return 0;

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        throw new Error('Invalid table name');
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const stmt = db.prepare(sql);
    
    return withTransaction(db, () => {
        let inserted = 0;
        for (const row of rows) {
            const values = columns.map(col => row[col]);
            stmt.run(...values);
            inserted++;
        }
        return inserted;
    });
}

/**
 * Update multiple rows by condition
 */
export function updateMany<T extends Record<string, unknown>>(
    db: Database.Database,
    tableName: string,
    updates: T,
    condition: { column: string; values: unknown[] }
): number {
    // Validate table name and column
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        throw new Error('Invalid table name');
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(condition.column)) {
        throw new Error('Invalid column name');
    }

    const setClauses = Object.keys(updates).map(col => `${col} = ?`).join(', ');
    const sql = `UPDATE ${tableName} SET ${setClauses} WHERE ${condition.column} = ?`;
    
    const stmt = db.prepare(sql);
    const updateValues = Object.values(updates);
    
    return withTransaction(db, () => {
        let updated = 0;
        for (const value of condition.values) {
            const result = stmt.run(...updateValues, value);
            updated += result.changes;
        }
        return updated;
    });
}

/**
 * Delete multiple rows by condition
 */
export function deleteMany(
    db: Database.Database,
    tableName: string,
    condition: { column: string; values: unknown[] }
): number {
    // Validate table name and column
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        throw new Error('Invalid table name');
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(condition.column)) {
        throw new Error('Invalid column name');
    }

    const placeholders = condition.values.map(() => '?').join(', ');
    const sql = `DELETE FROM ${tableName} WHERE ${condition.column} IN (${placeholders})`;
    
    const stmt = db.prepare(sql);
    const result = stmt.run(...condition.values);
    
    return result.changes;
}
