/**
 * MFE Service
 * Business logic for Micro-Frontend management
 */

import mfeManager from '../dashboard/lib/mfe-manager';
import { validateBody, CreateMFESchema, UpdateMFESchema, BumpVersionSchema } from '../security/validator';
import { analyzeGeneratedCode } from '../security/analyzer';
import { auditLog, AuditActions } from '../security/audit';
import type { MFEConfig, APIResponse } from '../types';

// ============================================================================
// MFE Service Class
// ============================================================================

export class MFEService {
    /**
     * List all MFEs
     */
    async list(): Promise<APIResponse<MFEConfig[]>> {
        try {
            const mfes = await mfeManager.listMFEs();
            return { success: true, data: mfes };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to list MFEs';
            return { success: false, error };
        }
    }

    /**
     * Get a single MFE by name
     */
    async get(name: string): Promise<APIResponse<MFEConfig>> {
        try {
            if (!name || typeof name !== 'string') {
                return { success: false, error: 'MFE name is required' };
            }

            const mfe = await mfeManager.getMFE(name);
            if (!mfe) {
                return { success: false, error: 'MFE not found' };
            }

            return { success: true, data: mfe };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to get MFE';
            return { success: false, error };
        }
    }

    /**
     * Create a new MFE
     */
    async create(data: unknown, userId?: string): Promise<APIResponse<MFEConfig>> {
        // Validate input
        const validation = await validateBody(CreateMFESchema, data);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        try {
            const created = await mfeManager.registerMFE(
                validation.data.name,
                validation.data.source,
                validation.data
            );

            await auditLog({
                action: AuditActions.MFE_CREATE,
                userId,
                resource: `mfe:${validation.data.name}`,
                success: true,
                metadata: { version: validation.data.version }
            });

            return { success: true, data: created };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to create MFE';
            
            await auditLog({
                action: AuditActions.MFE_CREATE,
                userId,
                resource: `mfe:${validation.data.name}`,
                success: false,
                metadata: { error }
            });

            return { success: false, error };
        }
    }

    /**
     * Update an existing MFE
     */
    async update(data: unknown, userId?: string): Promise<APIResponse<MFEConfig>> {
        const validation = await validateBody(UpdateMFESchema, data);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        try {
            const updated = await mfeManager.updateMFE(validation.data.name, validation.data);
            if (!updated) {
                return { success: false, error: 'MFE not found' };
            }

            await auditLog({
                action: AuditActions.MFE_UPDATE,
                userId,
                resource: `mfe:${validation.data.name}`,
                success: true
            });

            return { success: true, data: updated };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to update MFE';
            return { success: false, error };
        }
    }

    /**
     * Delete an MFE
     */
    async delete(name: string, userId?: string): Promise<APIResponse<void>> {
        if (!name || typeof name !== 'string') {
            return { success: false, error: 'MFE name is required' };
        }

        try {
            const deleted = await mfeManager.deleteMFE(name);
            if (!deleted) {
                return { success: false, error: 'MFE not found' };
            }

            await auditLog({
                action: AuditActions.MFE_DELETE,
                userId,
                resource: `mfe:${name}`,
                success: true
            });

            return { success: true, message: 'MFE deleted' };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to delete MFE';
            return { success: false, error };
        }
    }

    /**
     * Toggle MFE active status
     */
    async toggle(name: string, active: boolean, userId?: string): Promise<APIResponse<MFEConfig>> {
        if (!name || typeof name !== 'string') {
            return { success: false, error: 'MFE name is required' };
        }

        try {
            const toggled = await mfeManager.toggleMFE(name, active);
            if (!toggled) {
                return { success: false, error: 'MFE not found' };
            }

            await auditLog({
                action: AuditActions.MFE_TOGGLE,
                userId,
                resource: `mfe:${name}`,
                success: true,
                metadata: { active }
            });

            return { success: true, data: toggled };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to toggle MFE';
            return { success: false, error };
        }
    }

    /**
     * Bump MFE version
     */
    async bumpVersion(data: unknown, userId?: string): Promise<APIResponse<MFEConfig>> {
        const validation = await validateBody(BumpVersionSchema, data);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        try {
            const bumped = await mfeManager.bumpVersion(validation.data.name, validation.data.type);
            if (!bumped) {
                return { success: false, error: 'MFE not found' };
            }

            await auditLog({
                action: AuditActions.MFE_UPDATE,
                userId,
                resource: `mfe:${validation.data.name}`,
                success: true,
                metadata: { bumpType: validation.data.type, newVersion: bumped.version }
            });

            return { success: true, data: bumped };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to bump version';
            return { success: false, error };
        }
    }

    /**
     * Discover MFEs from filesystem
     */
    async discover(): Promise<APIResponse<string[]>> {
        try {
            const discovered = await mfeManager.discoverMFEs();
            return { success: true, data: discovered };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to discover MFEs';
            return { success: false, error };
        }
    }

    /**
     * Validate MFE code before registration
     */
    async validateCode(code: string): Promise<APIResponse<{ safe: boolean; issues: string[] }>> {
        try {
            const analysis = await analyzeGeneratedCode(code, 'javascript');
            
            return {
                success: true,
                data: {
                    safe: analysis.safe,
                    issues: analysis.issues.map(i => i.message)
                }
            };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to analyze code';
            return { success: false, error };
        }
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const mfeService = new MFEService();
