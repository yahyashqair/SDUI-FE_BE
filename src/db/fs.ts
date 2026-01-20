import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const TENANTS_DIR = path.resolve(process.cwd(), 'data', 'tenants');

// Ensure base dir exists
if (!fs.existsSync(TENANTS_DIR)) {
  fs.mkdirSync(TENANTS_DIR, { recursive: true });
}

export const FileSystem = {
  getProjectDir: (projectId: string) => path.join(TENANTS_DIR, projectId, 'src'),

  validatePath(projectId: string, targetPath: string): string {
    const projectRoot = path.join(TENANTS_DIR, projectId);
    const resolvedPath = path.resolve(projectRoot, 'src', targetPath);
    if (!resolvedPath.startsWith(projectRoot)) {
      throw new Error('Access denied: Path traversal attempt');
    }
    return resolvedPath;
  },

  initProject: async (projectId: string) => {
    const projectDir = path.join(TENANTS_DIR, projectId);
    const srcDir = path.join(projectDir, 'src');

    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    // Create lib/db.js helper
    const libDir = path.join(srcDir, 'lib');
    if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

    const dbHelperContent = `
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the tenant DB which is 2 levels up from src/lib
// src/lib/db.js -> src/lib -> src -> projectDir -> projectDir.db (no, it's ../../<id>.db relative to src)
// Actually structure is data/tenants/<id>/src/lib/db.js
// DB is at data/tenants/<id>.db
// So it is ../../../<id>.db
const dbPath = path.resolve(__dirname, '../../../${projectId}.db');
const db = new Database(dbPath);

module.exports = {
    query: (sql, ...args) => {
        const stmt = db.prepare(sql);
        if (sql.trim().toLowerCase().startsWith('select')) {
            return stmt.all(...args);
        } else {
            return stmt.run(...args);
        }
    }
};
    `;
    fs.writeFileSync(path.join(libDir, 'db.js'), dbHelperContent);

    // Init Git
    try {
      if (!fs.existsSync(path.join(projectDir, '.git'))) {
        await execAsync(`git init`, { cwd: projectDir });
        await execAsync(`git config user.email "ai@platform.com"`, { cwd: projectDir });
        await execAsync(`git config user.name "AI Builder"`, { cwd: projectDir });
      }
    } catch (e) {
      // console.error('Failed to init git', e);
    }

    return srcDir;
  },

  listFiles: (projectId: string, dir: string = '') => {
    // Validation handled by returning paths relative to safe dir
    const projectSrc = path.join(TENANTS_DIR, projectId, 'src');
    const targetDir = path.join(projectSrc, dir);

    // Initial basic check
    if (!path.resolve(targetDir).startsWith(projectSrc)) {
      throw new Error('Access denied: Path traversal attempt');
    }

    if (!fs.existsSync(targetDir)) return [];

    const files = fs.readdirSync(targetDir, { withFileTypes: true });
    return files.map(f => ({
      name: f.name,
      type: f.isDirectory() ? 'directory' : 'file',
      path: path.join(dir, f.name)
    }));
  },

  readFile: (projectId: string, filePath: string) => {
    const fullPath = FileSystem.validatePath(projectId, filePath);
    if (!fs.existsSync(fullPath)) throw new Error('File not found');
    return fs.readFileSync(fullPath, 'utf-8');
  },

  writeFile: async (projectId: string, filePath: string, content: string) => {
    const fullPath = FileSystem.validatePath(projectId, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(fullPath, content);
  },

  commit: async (projectId: string, message: string) => {
    const projectDir = path.join(TENANTS_DIR, projectId);
    try {
      await execAsync(`git add .`, { cwd: projectDir });
      await execAsync(`git commit -m "${message}"`, { cwd: projectDir });
      return true;
    } catch (e) {
      return false;
    }
  }
};
