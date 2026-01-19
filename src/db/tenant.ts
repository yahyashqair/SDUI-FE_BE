import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data', 'tenants');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const getTenantDB = (projectId: string) => {
  const dbPath = path.join(DB_DIR, `${projectId}.db`);
  return new Database(dbPath);
};

export const initTenantDB = (projectId: string, schema: any) => {
  const db = getTenantDB(projectId);
  // Basic schema applier. In real world, this would be a complex migration system.
  // We assume schema is a list of CREATE TABLE statements or similar simple structure for now.

  if (schema && Array.isArray(schema.tables)) {
    schema.tables.forEach((table: any) => {
      const columns = table.columns.map((col: any) => `${col.name} ${col.type}`).join(', ');
      db.exec(`CREATE TABLE IF NOT EXISTS ${table.name} (${columns})`);
    });
  }

  return db;
};
