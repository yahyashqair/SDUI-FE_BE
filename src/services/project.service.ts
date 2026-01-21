/**
 * Project Service
 * Business logic for project management
 */

import { PlatformDB } from '../db/platform';
import { FileSystem } from '../db/fs';
import { validateBody, ProjectIdSchema } from '../security/validator';
import { auditLog, AuditActions } from '../security/audit';
import type { Project, Blueprint, FunctionDef, APIResponse } from '../types';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateProjectSchema = z.object({
    name: z.string().min(1).max(100),
    subdomain: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i)
});

const SaveBlueprintSchema = z.object({
    projectId: ProjectIdSchema,
    uiSchema: z.record(z.unknown()),
    dataSchema: z.record(z.unknown())
});

// ============================================================================
// Project Service Class
// ============================================================================

export class ProjectService {
    /**
     * List all projects
     */
    async list(): Promise<APIResponse<Project[]>> {
        try {
            const projects = PlatformDB.getAllProjects();
            return { success: true, data: projects };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to list projects';
            return { success: false, error };
        }
    }

    /**
     * Get a single project by ID
     */
    async get(projectId: string): Promise<APIResponse<Project>> {
        try {
            const validation = await validateBody(ProjectIdSchema, projectId);
            if (!validation.success) {
                return { success: false, error: validation.error };
            }

            const project = PlatformDB.getProject(projectId);
            if (!project) {
                return { success: false, error: 'Project not found' };
            }

            return { success: true, data: project };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to get project';
            return { success: false, error };
        }
    }

    /**
     * Create a new project
     */
    async create(data: unknown, userId?: string): Promise<APIResponse<Project>> {
        const validation = await validateBody(CreateProjectSchema, data);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        try {
            const project = PlatformDB.createProject(
                validation.data.name,
                validation.data.subdomain
            );

            // Initialize project file structure
            await FileSystem.initProject(project.id);

            await auditLog({
                action: AuditActions.PROJECT_CREATE,
                userId,
                resource: `project:${project.id}`,
                success: true,
                metadata: { name: project.name, subdomain: project.subdomain }
            });

            return { success: true, data: project };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to create project';
            
            await auditLog({
                action: AuditActions.PROJECT_CREATE,
                userId,
                resource: 'project:new',
                success: false,
                metadata: { error }
            });

            return { success: false, error };
        }
    }

    /**
     * Get active blueprint for a project
     */
    async getBlueprint(projectId: string): Promise<APIResponse<Blueprint>> {
        try {
            const validation = await validateBody(ProjectIdSchema, projectId);
            if (!validation.success) {
                return { success: false, error: validation.error };
            }

            const blueprint = PlatformDB.getActiveBlueprint(projectId);
            if (!blueprint) {
                return { success: false, error: 'No active blueprint found' };
            }

            return { success: true, data: blueprint };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to get blueprint';
            return { success: false, error };
        }
    }

    /**
     * Save a blueprint for a project
     */
    async saveBlueprint(data: unknown, userId?: string): Promise<APIResponse<Blueprint>> {
        const validation = await validateBody(SaveBlueprintSchema, data);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        try {
            const blueprint = PlatformDB.saveBlueprint(
                validation.data.projectId,
                validation.data.uiSchema,
                validation.data.dataSchema
            );

            await auditLog({
                action: AuditActions.PROJECT_UPDATE,
                userId,
                resource: `project:${validation.data.projectId}`,
                success: true,
                metadata: { blueprintVersion: blueprint.version }
            });

            return { success: true, data: blueprint };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to save blueprint';
            return { success: false, error };
        }
    }

    /**
     * Get functions for a project
     */
    async getFunctions(projectId: string): Promise<APIResponse<FunctionDef[]>> {
        try {
            const validation = await validateBody(ProjectIdSchema, projectId);
            if (!validation.success) {
                return { success: false, error: validation.error };
            }

            const functions = PlatformDB.getFunctions(projectId);
            return { success: true, data: functions };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to get functions';
            return { success: false, error };
        }
    }

    /**
     * List files in a project
     */
    async listFiles(projectId: string, directory: string = ''): Promise<APIResponse<Array<{ name: string; type: 'file' | 'directory'; path: string }>>> {
        try {
            const validation = await validateBody(ProjectIdSchema, projectId);
            if (!validation.success) {
                return { success: false, error: validation.error };
            }

            const files = FileSystem.listFiles(projectId, directory);
            return { success: true, data: files };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to list files';
            return { success: false, error };
        }
    }

    /**
     * Read a file from a project
     */
    async readFile(projectId: string, filePath: string): Promise<APIResponse<string>> {
        try {
            const validation = await validateBody(ProjectIdSchema, projectId);
            if (!validation.success) {
                return { success: false, error: validation.error };
            }

            const content = FileSystem.readFile(projectId, filePath);
            return { success: true, data: content };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to read file';
            return { success: false, error };
        }
    }

    /**
     * Write a file to a project
     */
    async writeFile(projectId: string, filePath: string, content: string, userId?: string): Promise<APIResponse<void>> {
        try {
            const validation = await validateBody(ProjectIdSchema, projectId);
            if (!validation.success) {
                return { success: false, error: validation.error };
            }

            await FileSystem.writeFile(projectId, filePath, content);

            await auditLog({
                action: AuditActions.PROJECT_UPDATE,
                userId,
                resource: `project:${projectId}:${filePath}`,
                success: true
            });

            return { success: true, message: 'File written successfully' };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to write file';
            return { success: false, error };
        }
    }

    /**
     * Commit changes in a project
     */
    async commit(projectId: string, message: string, userId?: string): Promise<APIResponse<boolean>> {
        try {
            const validation = await validateBody(ProjectIdSchema, projectId);
            if (!validation.success) {
                return { success: false, error: validation.error };
            }

            const result = await FileSystem.commit(projectId, message);
            
            if (result) {
                await auditLog({
                    action: AuditActions.PROJECT_UPDATE,
                    userId,
                    resource: `project:${projectId}`,
                    success: true,
                    metadata: { type: 'commit', message }
                });
            }

            return { success: true, data: result };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to commit';
            return { success: false, error };
        }
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const projectService = new ProjectService();
