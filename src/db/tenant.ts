import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data', 'tenants');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

/**
 * Sanitize table/column names to prevent SQL injection
 * Only allows alphanumeric characters and underscores, must start with letter or underscore
 */
function sanitizeIdentifier(name: string, type: 'table' | 'column'): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid ${type} name: ${name}. Only alphanumeric characters and underscores are allowed.`);
  }
  if (name.length > 64) {
    throw new Error(`${type} name too long: ${name}. Maximum 64 characters allowed.`);
  }
  return name;
}

/**
 * Validate column type against allowed SQLite types
 */
const ALLOWED_TYPES = ['TEXT', 'INTEGER', 'REAL', 'BLOB', 'NUMERIC', 'BOOLEAN', 'DATETIME', 'DATE'];
function sanitizeColumnType(type: string): string {
  const normalized = type.toUpperCase().split('(')[0].trim();
  if (!ALLOWED_TYPES.includes(normalized)) {
    throw new Error(`Invalid column type: ${type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
  }
  // Allow type with size specification like VARCHAR(255)
  if (/^[A-Z]+(\(\d+\))?$/.test(type.toUpperCase())) {
    return type.toUpperCase();
  }
  return normalized;
}

/**
 * Validate project ID format
 */
function validateProjectId(projectId: string): string {
  if (!/^[a-zA-Z0-9-_]{1,64}$/.test(projectId)) {
    throw new Error(`Invalid project ID: ${projectId}. Only alphanumeric characters, hyphens, and underscores are allowed.`);
  }
  return projectId;
}

export const getTenantDB = (projectId: string) => {
  const safeProjectId = validateProjectId(projectId);
  const dbPath = path.join(DB_DIR, `${safeProjectId}.db`);
  return new Database(dbPath);
};

export const initTenantDB = (projectId: string, schema: any) => {
  const db = getTenantDB(projectId);
  // Basic schema applier with security validation

  if (schema && Array.isArray(schema.tables)) {
    schema.tables.forEach((table: any) => {
      const safeName = sanitizeIdentifier(table.name, 'table');
      const columns = table.columns.map((col: any) => {
        const safeColName = sanitizeIdentifier(col.name, 'column');
        const safeColType = sanitizeColumnType(col.type);
        return `${safeColName} ${safeColType}`;
      }).join(', ');
      db.exec(`CREATE TABLE IF NOT EXISTS ${safeName} (${columns})`);
    });
  }

  return db;
};
