import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const PLATFORM_DB_PATH = path.join(DB_DIR, 'platform.db');
const db = new Database(PLATFORM_DB_PATH);

// Initialize Platform Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blueprints (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    ui_schema TEXT NOT NULL,
    data_schema TEXT NOT NULL,
    active BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS functions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
`);

export interface Project {
  id: string;
  name: string;
  subdomain: string;
  created_at: string;
}

export interface Blueprint {
  id: string;
  project_id: string;
  version: number;
  ui_schema: string;
  data_schema: string;
  active: boolean;
  created_at: string;
}

export interface FunctionDef {
  id: string;
  project_id: string;
  name: string;
  code: string;
  method: string;
  created_at: string;
}

export const PlatformDB = {
  createProject: (name: string, subdomain: string): Project => {
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO projects (id, name, subdomain) VALUES (?, ?, ?)');
    stmt.run(id, name, subdomain);
    return { id, name, subdomain, created_at: new Date().toISOString() };
  },

  getProject: (id: string): Project | undefined => {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
  },

  getAllProjects: (): Project[] => {
    return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];
  },

  saveBlueprint: (projectId: string, uiSchema: any, dataSchema: any): Blueprint => {
    const id = uuidv4();
    // Simple versioning: count existing + 1
    const count = db.prepare('SELECT COUNT(*) as count FROM blueprints WHERE project_id = ?').get(projectId) as { count: number };
    const version = count.count + 1;

    // Deactivate others if this is active (default active for now)
    db.prepare('UPDATE blueprints SET active = 0 WHERE project_id = ?').run(projectId);

    const stmt = db.prepare('INSERT INTO blueprints (id, project_id, version, ui_schema, data_schema, active) VALUES (?, ?, ?, ?, ?, 1)');
    stmt.run(id, projectId, version, JSON.stringify(uiSchema), JSON.stringify(dataSchema));

    return {
      id,
      project_id: projectId,
      version,
      ui_schema: JSON.stringify(uiSchema),
      data_schema: JSON.stringify(dataSchema),
      active: true,
      created_at: new Date().toISOString()
    };
  },

  getActiveBlueprint: (projectId: string): Blueprint | undefined => {
    return db.prepare('SELECT * FROM blueprints WHERE project_id = ? AND active = 1 ORDER BY version DESC LIMIT 1').get(projectId) as Blueprint;
  },

  saveFunction: (projectId: string, name: string, code: string, method: string = 'GET') => {
    const id = uuidv4();
    // Upsert logic for simplicity (overwrite same name for project)
    const existing = db.prepare('SELECT id FROM functions WHERE project_id = ? AND name = ?').get(projectId, name) as { id: string };

    if (existing) {
      db.prepare('UPDATE functions SET code = ?, method = ? WHERE id = ?').run(code, method, existing.id);
      return { id: existing.id, project_id: projectId, name, code, method, created_at: new Date().toISOString() };
    } else {
      const stmt = db.prepare('INSERT INTO functions (id, project_id, name, code, method) VALUES (?, ?, ?, ?, ?)');
      stmt.run(id, projectId, name, code, method);
      return { id, project_id: projectId, name, code, method, created_at: new Date().toISOString() };
    }
  },

  getFunctions: (projectId: string): FunctionDef[] => {
    return db.prepare('SELECT * FROM functions WHERE project_id = ?').all(projectId) as FunctionDef[];
  }
};
