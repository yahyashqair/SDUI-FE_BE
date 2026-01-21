
import { PlatformDB } from '../db/platform';
import { FileSystem, validateProjectId } from '../db/fs';
import { initTenantDB } from '../db/tenant';
import { buildMFE } from '../platform/bundler';
import fissionClient from '../dashboard/lib/fission-client';
import mfeManager from '../dashboard/lib/mfe-manager';
import { agentMemory } from './memory';
import { analyzeGeneratedCode } from '../security/analyzer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const TENANTS_DIR = path.resolve(process.cwd(), 'data', 'tenants');

/**
 * AI Tools Definition
 * These are the tools the AI can use to build the application.
 */

export interface ToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
}

/**
 * Log tool execution for memory/audit
 */
function logToolExecution(projectId: string, toolName: string, result: ToolResult): void {
    agentMemory.save(projectId, {
        projectId,
        agentType: 'engineer',
        action: `tool:${toolName}`,
        result,
        context: { toolName }
    });
}

export const AITools = {
    /**
     * Reads the current project context (files, structure)
     */
    readProjectContext: async (projectId: string): Promise<ToolResult> => {
        try {
            // Get file list
            const files = await FileSystem.listFiles(projectId);

            // Read key config files if they exist
            let packageJson = '';
            try {
                packageJson = await FileSystem.readFile(projectId, 'package.json');
            } catch (e) { }

            return {
                success: true,
                data: {
                    files,
                    packageJson: packageJson ? JSON.parse(packageJson) : null,
                    structure: "Standard MFE + Microservices structure"
                }
            };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Defines a route connecting a path to an MFE
     */
    defineRoute: async (projectId: string, path: string, mfeName: string): Promise<ToolResult> => {
        try {
            // For now, we'll store routes in a simple JSON file or DB
            // Assuming PlatformDB has a way to store routes or we use a `routes.json` file
            const routesFile = 'routes.json';
            let routes: Record<string, any> = {};

            try {
                const content = await FileSystem.readFile(projectId, routesFile);
                routes = JSON.parse(content);
            } catch (e) {
                // File doesn't exist yet, start empty
            }

            routes[path] = {
                mfe: mfeName,
                updatedAt: new Date().toISOString()
            };

            await FileSystem.writeFile(projectId, routesFile, JSON.stringify(routes, null, 2));
            return { success: true, data: { message: `Route ${path} -> ${mfeName} defined` } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Updates the database schema for the project
     */
    updateDatabaseSchema: async (projectId: string, schema: any): Promise<ToolResult> => {
        try {
            // Update Platform Metadata
            const currentBp = PlatformDB.getActiveBlueprint(projectId);
            // Default to empty object if no blueprint exists yet
            const uiSchema = currentBp ? JSON.parse(currentBp.ui_schema) : {};

            PlatformDB.saveBlueprint(projectId, uiSchema, schema);

            // Apply to Tenant DB
            initTenantDB(projectId, schema);
            return { success: true, data: { message: 'Schema updated' } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Creates or updates a backend serverless function
     */
    createBackendFunction: async (projectId: string, filePath: string, code: string): Promise<ToolResult> => {
        try {
            await FileSystem.writeFile(projectId, filePath, code);
            // PlatformDB.saveFunction(projectId, name, fileName); // Removed simple function tracking for now as we have full DDD

            // TODO: In a real DDD setup, we might deploy the whole service or specific handlers.
            // For now, we just save the file. Deployment would happen in a separate step or via `runCommand`

            return { success: true, data: { message: `File ${filePath} created.` } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Creates or updates a Frontend MFE Component
     */
    createFrontendComponent: async (projectId: string, filePath: string, code: string): Promise<ToolResult> => {
        try {
            await FileSystem.writeFile(projectId, filePath, code);

            // Auto-build (Local esbuild) - Simplified for this demo
            // In a real MFE setup, we'd trigger a build of the remote module.

            return { success: true, data: { message: `File ${filePath} created.` } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Runs the Verification Gate
     */
    runVerificationGate: async (projectId: string, type: 'backend' | 'frontend'): Promise<ToolResult> => {
        try {
            // Locate the verification script
            const verificationScript = path.resolve(process.cwd(), 'verification-gate', 'verify.ts');

            // In a real scenario, the project files are in `data/tenants/<projectId>`.
            // We need to pass this path to the verification script.
            const projectDir = FileSystem.getProjectDir(projectId);

            // We need to run ts-node to execute the verification script
            // Assuming ts-node is available or we use node with -r ts-node/register
            const cmd = `npx ts-node ${verificationScript} ${projectDir} ${type}`;

            const { stdout, stderr } = await execAsync(cmd);

            return { success: true, data: { message: 'Verification Passed', output: stdout } };
        } catch (e: any) {
             return { success: false, error: `Verification Failed: ${e.stdout} \n ${e.stderr}` };
        }
    },

    /**
     * Writes a design document (ADR, Diagram, README) to the design/ folder
     */
    writeDesignDocument: async (projectId: string, path: string, content: string): Promise<ToolResult> => {
        try {
            // Ensure path starts with design/
            const fullPath = path.startsWith('design/') ? path : `design/${path}`;
            await FileSystem.writeFile(projectId, fullPath, content);
            return { success: true, data: { message: `Design document written to ${fullPath}` } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Search for files matching a pattern or content
     */
    searchFiles: async (projectId: string, query: string, path: string = '.'): Promise<ToolResult> => {
        try {
            const allFiles = await FileSystem.listFiles(projectId, path);
            const matches = [];

            for (const f of allFiles) {
                if (f.type === 'directory') continue;

                // Match filename
                if (f.path.includes(query)) {
                    matches.push(f.path);
                    continue;
                }

                // Match content (simple grep)
                try {
                    const content = FileSystem.readFile(projectId, f.path);
                    if (content.includes(query)) {
                        matches.push(f.path);
                    }
                } catch (e) { }
            }

            return { success: true, data: { files: matches } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Read file content
     */
    readFile: async (projectId: string, path: string): Promise<ToolResult> => {
        try {
            const content = await FileSystem.readFile(projectId, path);
            return { success: true, data: { content } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Edit file content (Simplified overwrite for now, would be line-based in future)
     */
    editFile: async (projectId: string, path: string, content: string): Promise<ToolResult> => {
        try {
            await FileSystem.writeFile(projectId, path, content);
            return { success: true, data: { message: `File ${path} updated` } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Run a shell command (SAFE MODE)
     */
    runCommand: async (projectId: string, command: string): Promise<ToolResult> => {
        // Validate project ID
        try {
            validateProjectId(projectId);
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Invalid project ID';
            return { success: false, error };
        }

        // ALLOW-LIST ONLY
        const ALLOWED_COMMANDS = ['npm run build', 'npm test', 'npx tsc', 'git status', 'ls', 'npm install'];
        const isAllowed = ALLOWED_COMMANDS.some(cmd => command.startsWith(cmd));

        if (!isAllowed) {
            return { success: false, error: `Command not allowed: ${command}` };
        }

        try {
            const projectDir = path.join(TENANTS_DIR, projectId);
            if (!fs.existsSync(projectDir)) {
                return { success: false, error: 'Project directory does not exist' };
            }

            const { stdout, stderr } = await execAsync(command, { 
                cwd: projectDir,
                timeout: 30000 // 30 second timeout
            });
            
            const result: ToolResult = { 
                success: true, 
                data: { output: stdout, stderr: stderr || undefined } 
            };
            logToolExecution(projectId, 'runCommand', result);
            return result;
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Command execution failed';
            return { success: false, error };
        }
    },

    gitInit: async (projectId: string): Promise<ToolResult> => {
        try {
            validateProjectId(projectId);
            const projectDir = path.join(TENANTS_DIR, projectId);
            
            // Ensure directory exists
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, { recursive: true });
            }
            
            // Check if already initialized
            if (fs.existsSync(path.join(projectDir, '.git'))) {
                return { success: true, data: { message: 'Git repository already initialized' } };
            }
            
            await execAsync('git init', { cwd: projectDir });
            await execAsync('git config user.email "ai@platform.local"', { cwd: projectDir });
            await execAsync('git config user.name "AI Platform"', { cwd: projectDir });
            
            const result: ToolResult = { success: true, data: { message: 'Git repository initialized' } };
            logToolExecution(projectId, 'gitInit', result);
            return result;
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Git init failed';
            return { success: false, error };
        }
    },

    gitCheckout: async (projectId: string, branch: string, create: boolean = false): Promise<ToolResult> => {
        try {
            validateProjectId(projectId);
            
            // Validate branch name
            if (!/^[a-zA-Z0-9_/-]+$/.test(branch)) {
                return { success: false, error: 'Invalid branch name' };
            }
            
            const projectDir = path.join(TENANTS_DIR, projectId);
            
            if (!fs.existsSync(path.join(projectDir, '.git'))) {
                return { success: false, error: 'Not a git repository. Run gitInit first.' };
            }
            
            const flag = create ? '-b' : '';
            await execAsync(`git checkout ${flag} ${branch}`.trim(), { cwd: projectDir });
            
            const result: ToolResult = { 
                success: true, 
                data: { message: `Checked out branch: ${branch}` } 
            };
            logToolExecution(projectId, 'gitCheckout', result);
            return result;
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Git checkout failed';
            return { success: false, error };
        }
    },

    gitCommit: async (projectId: string, message: string): Promise<ToolResult> => {
        try {
            validateProjectId(projectId);
            
            // Sanitize commit message
            const safeMessage = message
                .replace(/[`$\\!"']/g, '')
                .substring(0, 200);
            
            if (!safeMessage.trim()) {
                return { success: false, error: 'Commit message is required' };
            }
            
            const projectDir = path.join(TENANTS_DIR, projectId);
            
            if (!fs.existsSync(path.join(projectDir, '.git'))) {
                return { success: false, error: 'Not a git repository. Run gitInit first.' };
            }
            
            // Stage all changes
            await execAsync('git add -A', { cwd: projectDir });
            
            // Check if there are changes to commit
            try {
                await execAsync('git diff --staged --quiet', { cwd: projectDir });
                return { success: true, data: { message: 'No changes to commit' } };
            } catch {
                // Changes exist, proceed with commit
            }
            
            await execAsync(`git commit -m "${safeMessage}"`, { cwd: projectDir });
            
            const result: ToolResult = { 
                success: true, 
                data: { message: `Committed: ${safeMessage}` } 
            };
            logToolExecution(projectId, 'gitCommit', result);
            return result;
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Git commit failed';
            return { success: false, error };
        }
    },

    /**
     * Get git status for a project
     */
    gitStatus: async (projectId: string): Promise<ToolResult> => {
        try {
            validateProjectId(projectId);
            const projectDir = path.join(TENANTS_DIR, projectId);
            
            if (!fs.existsSync(path.join(projectDir, '.git'))) {
                return { success: false, error: 'Not a git repository' };
            }
            
            const { stdout } = await execAsync('git status --porcelain', { cwd: projectDir });
            const { stdout: branch } = await execAsync('git branch --show-current', { cwd: projectDir });
            
            return { 
                success: true, 
                data: { 
                    branch: branch.trim(),
                    changes: stdout.split('\n').filter(l => l.trim()),
                    clean: stdout.trim() === ''
                } 
            };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Git status failed';
            return { success: false, error };
        }
    },

    /**
     * Get git log for a project
     */
    gitLog: async (projectId: string, limit: number = 10): Promise<ToolResult> => {
        try {
            validateProjectId(projectId);
            const projectDir = path.join(TENANTS_DIR, projectId);
            
            if (!fs.existsSync(path.join(projectDir, '.git'))) {
                return { success: false, error: 'Not a git repository' };
            }
            
            const { stdout } = await execAsync(
                `git log --oneline -n ${Math.min(limit, 50)}`, 
                { cwd: projectDir }
            );
            
            const commits = stdout.split('\n').filter(l => l.trim()).map(line => {
                const [hash, ...messageParts] = line.split(' ');
                return { hash, message: messageParts.join(' ') };
            });
            
            return { success: true, data: { commits } };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Git log failed';
            return { success: false, error };
        }
    }
};
