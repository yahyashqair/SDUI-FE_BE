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

/**
 * Validate project ID format - prevent directory traversal via project ID
 */
function validateProjectId(projectId: string): string {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Invalid project ID: must be a non-empty string');
  }
  if (!/^[a-zA-Z0-9-_]{1,64}$/.test(projectId)) {
    throw new Error('Invalid project ID: only alphanumeric characters, hyphens, and underscores are allowed (max 64 chars)');
  }
  return projectId;
}

/**
 * List of sensitive file patterns that should not be accessible
 */
const SENSITIVE_PATTERNS = [
  /^\./, // Hidden files (starting with .)
  /\.env$/i, // Environment files
  /\.pem$/i, // Private keys
  /\.key$/i, // Key files
  /^id_rsa/, // SSH keys
  /\.sqlite$/i, // Database files
  /\.db$/i, // Database files
];

/**
 * Check if a file path matches sensitive patterns
 */
function isSensitivePath(filePath: string): boolean {
  const basename = path.basename(filePath);
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(basename));
}

export const FileSystem = {
  getProjectDir: (projectId: string) => {
    const safeId = validateProjectId(projectId);
    return path.join(TENANTS_DIR, safeId, 'src');
  },

  validatePath(projectId: string, targetPath: string): string {
    // Validate project ID first
    const safeProjectId = validateProjectId(projectId);
    
    // Validate target path
    if (!targetPath || typeof targetPath !== 'string') {
      throw new Error('Invalid target path: must be a non-empty string');
    }
    
    // Normalize and check for null bytes
    if (targetPath.includes('\0')) {
      throw new Error('Invalid target path: null bytes not allowed');
    }
    
    const projectRoot = path.join(TENANTS_DIR, safeProjectId);
    const srcRoot = path.join(projectRoot, 'src');
    const resolvedPath = path.resolve(srcRoot, targetPath);
    
    // Check path stays within project boundary
    if (!resolvedPath.startsWith(projectRoot)) {
      throw new Error('Access denied: Path traversal attempt detected');
    }
    
    // Try to resolve symlinks if path exists
    try {
      if (fs.existsSync(resolvedPath)) {
        const realPath = fs.realpathSync(resolvedPath);
        const realRoot = fs.realpathSync(projectRoot);
        
        if (!realPath.startsWith(realRoot)) {
          throw new Error('Access denied: Symlink traversal attempt detected');
        }
      }
    } catch (e: any) {
      // If realpath fails for reasons other than non-existence, deny access
      if (e.code !== 'ENOENT') {
        throw new Error('Access denied: Path validation failed');
      }
    }
    
    // Check for sensitive file patterns
    if (isSensitivePath(targetPath)) {
      throw new Error('Access denied: Cannot access sensitive files');
    }
    
    return resolvedPath;
  },

  initProject: async (projectId: string) => {
    const safeProjectId = validateProjectId(projectId);
    const projectDir = path.join(TENANTS_DIR, safeProjectId);
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

  listFiles: (projectId: string, dir: string = ''): Array<{ name: string, type: 'directory' | 'file', path: string }> => {
    const safeProjectId = validateProjectId(projectId);
    const projectSrc = path.join(TENANTS_DIR, safeProjectId, 'src');
    
    // Validate directory path
    if (dir && typeof dir === 'string' && dir.includes('..')) {
      throw new Error('Access denied: Path traversal attempt');
    }
    
    const targetDir = path.join(projectSrc, dir);

    if (!path.resolve(targetDir).startsWith(projectSrc)) {
      throw new Error('Access denied: Path traversal attempt');
    }

    if (!fs.existsSync(targetDir)) return [];

    const results: Array<{ name: string, type: 'directory' | 'file', path: string }> = [];

    function walk(currentDir: string, relativePath: string) {
      const files = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const f of files) {
        // Skip hidden files and sensitive patterns
        if (f.name.startsWith('.')) continue;
        
        const relPath = path.join(relativePath, f.name);
        results.push({
          name: f.name,
          type: f.isDirectory() ? 'directory' : 'file',
          path: relPath
        });
        if (f.isDirectory()) {
          walk(path.join(currentDir, f.name), relPath);
        }
      }
    }

    walk(targetDir, dir);
    return results;
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
    const safeProjectId = validateProjectId(projectId);
    const projectDir = path.join(TENANTS_DIR, safeProjectId);
    
    // Sanitize commit message - remove any shell metacharacters
    const safeMessage = message.replace(/[`$\\!"']/g, '').substring(0, 200);
    
    try {
      await execAsync(`git add .`, { cwd: projectDir });
      await execAsync(`git commit -m "${safeMessage}"`, { cwd: projectDir });
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Export validateProjectId for use in other modules
export { validateProjectId };
