
import { PlatformDB } from '../../db/platform';
import { FileSystem } from '../../db/fs';
import { initTenantDB } from '../../db/tenant';
import { buildMFE } from '../../runtime/bundler';

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
            return { success: true, data: { message: `Function ${name} created` } };
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

            // Auto-build
            try {
                await buildMFE(projectId, name);
                return { success: true, data: { message: `Component ${name} created and built` } };
            } catch (buildError: any) {
                 return { success: true, data: { message: `Component ${name} created but build failed: ${buildError.message}` } };
            }
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Updates the UI Layout (SDUI)
     */
    updateUILayout: async (projectId: string, layout: any): Promise<ToolResult> => {
        try {
            const currentBp = PlatformDB.getActiveBlueprint(projectId);
            // Default to empty tables if no blueprint exists yet
            const dataSchema = currentBp ? JSON.parse(currentBp.data_schema) : { tables: [] };

            PlatformDB.saveBlueprint(projectId, layout, dataSchema);
            return { success: true, data: { message: 'UI Layout updated' } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
};
