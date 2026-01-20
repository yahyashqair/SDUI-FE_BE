
import { PlatformDB } from '../db/platform';
import { FileSystem } from '../db/fs';
import { initTenantDB } from '../db/tenant';
import { buildMFE } from '../platform/bundler';
import fissionClient from '../dashboard/lib/fission-client';
import mfeManager from '../dashboard/lib/mfe-manager';

/**
 * AI Tools Definition
 * These are the tools the AI can use to build the application.
 */

export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
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
    createBackendFunction: async (projectId: string, name: string, code: string): Promise<ToolResult> => {
        try {
            const fileName = `${name}.js`;
            await FileSystem.writeFile(projectId, fileName, code);
            PlatformDB.saveFunction(projectId, name, fileName);

            // SYNC: Deploy to Fission (Master App)
            try {
                // Use a temp file for deployment if needed, or pass code path
                // fissionClient usually expects a path. The FileSystem writes to `data/tenants/...`
                // We'll calculate the absolute path.
                const absPath = FileSystem.getProjectDir(projectId) + '/' + fileName;

                // Attempt create, fallback to update
                try {
                    await fissionClient.createFunction(name, 'nodejs', absPath, 'default');
                } catch (createError) {
                    await fissionClient.updateFunction(name, absPath, 'default');
                }
            } catch (fissionError: any) {
                console.error('Fission deployment failed:', fissionError);
                return { success: true, data: { message: `Function created locally but Fission deployment failed: ${fissionError.message}` } };
            }

            return { success: true, data: { message: `Function ${name} created and deployed to Fission` } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Creates or updates a Frontend MFE Component
     */
    createFrontendComponent: async (projectId: string, name: string, code: string): Promise<ToolResult> => {
        try {
            const fileName = `frontend/${name}.tsx`;
            await FileSystem.writeFile(projectId, fileName, code);

            // Auto-build (Local esbuild)
            try {
                await buildMFE(projectId, name);

                // SYNC: Register with Master App MFE Registry
                // Assuming the user's API serves it at /api/mfe/:projectId/:name.js
                const publicUrl = `/api/mfe/${projectId}/${name}.js`;
                await mfeManager.registerMFE(name, publicUrl, {
                    active: true,
                    description: `Generated by AI for project ${projectId}`
                });

                return { success: true, data: { message: `Component ${name} created, built, and registered` } };
            } catch (buildError: any) {
                return { success: true, data: { message: `Component ${name} created but build/registration failed: ${buildError.message}` } };
            }
        } catch (e: any) {
            return { success: false, error: e.message };
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
        // ALLOW-LIST ONLY
        const ALLOWED_COMMANDS = ['npm run build', 'npm test', 'npx tsc', 'git status', 'ls'];
        const isAllowed = ALLOWED_COMMANDS.some(cmd => command.startsWith(cmd));

        if (!isAllowed) {
            return { success: false, error: `Command not allowed: ${command}` };
        }

        // Mock execution
        return { success: true, data: { output: `Mock output for: ${command}` } };
    },

    gitInit: async (projectId: string): Promise<ToolResult> => {
        try {
            // Note: In a real implementation this would exec git init
            // For now, we mock or use the existing safe runner if extended
            return { success: true, data: { message: "Git initialized (mock)" } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    gitCheckout: async (projectId: string, branch: string, create: boolean): Promise<ToolResult> => {
        try {
            // Mock branching
            return { success: true, data: { message: `Checked out ${branch}` } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    gitCommit: async (projectId: string, message: string): Promise<ToolResult> => {
        try {
            // Mock commit
            return { success: true, data: { message: `Committed: ${message}` } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
};
