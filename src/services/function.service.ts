/**
 * Function Service
 * Business logic for serverless function management
 */

import fissionClient from '../dashboard/lib/fission-client';
import { validateBody, CreateFunctionSchema, UpdateFunctionSchema, TestFunctionSchema } from '../security/validator';
import { analyzeGeneratedCode } from '../security/analyzer';
import { auditLog, AuditActions } from '../security/audit';
import fs from 'fs';
import path from 'path';
import type { FissionFunction, APIResponse } from '../types';

// ============================================================================
// Function Service Class
// ============================================================================

export class FunctionService {
    /**
     * List all functions
     */
    async list(): Promise<APIResponse<FissionFunction[]>> {
        try {
            const functions = await fissionClient.listFunctions();
            return { success: true, data: functions };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to list functions';
            return { success: false, error };
        }
    }

    /**
     * Create a new function
     */
    async create(data: unknown, userId?: string): Promise<APIResponse<{ message: string }>> {
        // Validate input
        const validation = await validateBody(CreateFunctionSchema, data);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        try {
            // If code is provided directly, analyze and write to temp file
            let codePath = validation.data.codePath;
            
            if (validation.data.code) {
                // Analyze code for security issues
                const analysis = await analyzeGeneratedCode(validation.data.code, 'javascript');
                if (!analysis.safe) {
                    const issues = analysis.issues.map(i => i.message).join('; ');
                    return { success: false, error: `Code security issues: ${issues}` };
                }

                // Write to temp file
                const tmpDir = '/tmp';
                const tmpFile = path.join(tmpDir, `${validation.data.name}-${Date.now()}.js`);
                fs.writeFileSync(tmpFile, validation.data.code);
                codePath = tmpFile;
            }

            if (!codePath) {
                return { success: false, error: 'Either code or codePath must be provided' };
            }

            const result = await fissionClient.createFunction(
                validation.data.name,
                validation.data.env || 'nodejs',
                codePath,
                validation.data.namespace
            );

            await auditLog({
                action: AuditActions.FUNCTION_CREATE,
                userId,
                resource: `function:${validation.data.name}`,
                success: true,
                metadata: { env: validation.data.env, namespace: validation.data.namespace }
            });

            return { success: true, data: { message: result } };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to create function';
            
            await auditLog({
                action: AuditActions.FUNCTION_CREATE,
                userId,
                resource: `function:${validation.data.name}`,
                success: false,
                metadata: { error }
            });

            return { success: false, error };
        }
    }

    /**
     * Update an existing function
     */
    async update(data: unknown, userId?: string): Promise<APIResponse<{ message: string }>> {
        const validation = await validateBody(UpdateFunctionSchema, data);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        try {
            let codePath = validation.data.codePath;
            
            if (validation.data.code) {
                // Analyze code for security issues
                const analysis = await analyzeGeneratedCode(validation.data.code, 'javascript');
                if (!analysis.safe) {
                    const issues = analysis.issues.map(i => i.message).join('; ');
                    return { success: false, error: `Code security issues: ${issues}` };
                }

                // Write to temp file
                const tmpDir = '/tmp';
                const tmpFile = path.join(tmpDir, `${validation.data.name}-${Date.now()}.js`);
                fs.writeFileSync(tmpFile, validation.data.code);
                codePath = tmpFile;
            }

            if (!codePath) {
                return { success: false, error: 'Either code or codePath must be provided' };
            }

            const result = await fissionClient.updateFunction(
                validation.data.name,
                codePath,
                validation.data.namespace
            );

            await auditLog({
                action: AuditActions.FUNCTION_UPDATE,
                userId,
                resource: `function:${validation.data.name}`,
                success: true
            });

            return { success: true, data: { message: result } };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to update function';
            return { success: false, error };
        }
    }

    /**
     * Delete a function
     */
    async delete(name: string, namespace: string = 'default', userId?: string): Promise<APIResponse<{ message: string }>> {
        if (!name || typeof name !== 'string') {
            return { success: false, error: 'Function name is required' };
        }

        try {
            const result = await fissionClient.deleteFunction(name, namespace);

            await auditLog({
                action: AuditActions.FUNCTION_DELETE,
                userId,
                resource: `function:${name}`,
                success: true,
                metadata: { namespace }
            });

            return { success: true, data: { message: result } };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to delete function';
            return { success: false, error };
        }
    }

    /**
     * Get function logs
     */
    async getLogs(name: string, namespace: string = 'default'): Promise<APIResponse<string>> {
        if (!name || typeof name !== 'string') {
            return { success: false, error: 'Function name is required' };
        }

        try {
            const logs = await fissionClient.getFunctionLogs(name, namespace);
            return { success: true, data: logs };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to get logs';
            return { success: false, error };
        }
    }

    /**
     * Test a function
     */
    async test(data: unknown, userId?: string): Promise<APIResponse<string>> {
        const validation = await validateBody(TestFunctionSchema, data);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        try {
            const result = await fissionClient.testFunction(
                validation.data.name,
                validation.data.method,
                validation.data.body,
                validation.data.namespace
            );

            return { success: true, data: result };
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : 'Failed to test function';
            return { success: false, error };
        }
    }

    /**
     * Validate function code before deployment
     */
    async validateCode(code: string): Promise<APIResponse<{ safe: boolean; issues: string[]; warnings: string[] }>> {
        try {
            const analysis = await analyzeGeneratedCode(code, 'javascript');
            
            return {
                success: true,
                data: {
                    safe: analysis.safe,
                    issues: analysis.issues.map(i => i.message),
                    warnings: analysis.warnings.map(w => w.message)
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

export const functionService = new FunctionService();
