/**
 * Request Validation Schemas
 * Provides Zod schemas for API request validation
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Project ID validation
 * Must be alphanumeric with hyphens and underscores, 1-64 characters
 */
export const ProjectIdSchema = z
    .string()
    .min(1, 'Project ID is required')
    .max(64, 'Project ID must be at most 64 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Project ID must contain only alphanumeric characters, hyphens, and underscores');

/**
 * Name validation (for functions, MFEs, routes, etc.)
 */
export const NameSchema = z
    .string()
    .min(1, 'Name is required')
    .max(64, 'Name must be at most 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9-_]*$/, 'Name must start with a letter and contain only alphanumeric characters, hyphens, and underscores');

/**
 * Version validation (semver)
 */
export const VersionSchema = z
    .string()
    .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, 'Version must be in semver format (e.g., 1.0.0)');

/**
 * URL path validation
 */
export const UrlPathSchema = z
    .string()
    .startsWith('/', 'URL path must start with /')
    .max(256, 'URL path must be at most 256 characters')
    .regex(/^[a-zA-Z0-9/_.-]+$/, 'URL path contains invalid characters');

/**
 * HTTP method validation
 */
export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);

/**
 * Environment validation
 */
export const EnvironmentSchema = z.enum(['nodejs', 'python', 'go']);

/**
 * Namespace validation
 */
export const NamespaceSchema = z
    .string()
    .max(64, 'Namespace must be at most 64 characters')
    .regex(/^[a-z0-9-]+$/, 'Namespace must contain only lowercase letters, numbers, and hyphens')
    .default('default');

// ============================================================================
// MFE Schemas
// ============================================================================

/**
 * MFE creation schema
 */
export const CreateMFESchema = z.object({
    name: NameSchema,
    source: z.string().min(1, 'Source URL is required').max(512),
    version: VersionSchema.optional().default('1.0.0'),
    description: z.string().max(500).optional(),
    active: z.boolean().optional().default(true),
    variables: z.record(z.unknown()).optional().default({}),
    encapsulation: z.enum(['shadow', 'none']).optional().default('none')
});

/**
 * MFE update schema
 */
export const UpdateMFESchema = z.object({
    name: NameSchema,
    source: z.string().min(1).max(512).optional(),
    version: VersionSchema.optional(),
    description: z.string().max(500).optional(),
    active: z.boolean().optional(),
    variables: z.record(z.unknown()).optional(),
    encapsulation: z.enum(['shadow', 'none']).optional()
});

/**
 * MFE toggle schema
 */
export const ToggleMFESchema = z.object({
    name: NameSchema,
    active: z.boolean()
});

/**
 * MFE version bump schema
 */
export const BumpVersionSchema = z.object({
    name: NameSchema,
    type: z.enum(['major', 'minor', 'patch']).optional().default('patch')
});

// ============================================================================
// Function Schemas
// ============================================================================

/**
 * Code validation
 * Limits code size and checks for basic validity
 */
export const CodeSchema = z
    .string()
    .max(100000, 'Code must be at most 100KB')
    .refine(
        (code) => !code.includes('\0'),
        'Code must not contain null bytes'
    );

/**
 * Function creation schema
 */
export const CreateFunctionSchema = z.object({
    name: NameSchema,
    code: CodeSchema.optional(),
    codePath: z.string().max(512).optional(),
    env: EnvironmentSchema.optional().default('nodejs'),
    namespace: NamespaceSchema
}).refine(
    (data) => data.code || data.codePath,
    'Either code or codePath must be provided'
);

/**
 * Function update schema
 */
export const UpdateFunctionSchema = z.object({
    name: NameSchema,
    code: CodeSchema.optional(),
    codePath: z.string().max(512).optional(),
    namespace: NamespaceSchema
});

/**
 * Function test schema
 */
export const TestFunctionSchema = z.object({
    name: NameSchema,
    method: HttpMethodSchema.optional().default('GET'),
    body: z.string().max(10000).optional(),
    namespace: NamespaceSchema
});

// ============================================================================
// Route Schemas
// ============================================================================

/**
 * Route creation schema
 */
export const CreateRouteSchema = z.object({
    name: NameSchema,
    method: HttpMethodSchema,
    url: UrlPathSchema,
    function: NameSchema
});

/**
 * Route delete schema
 */
export const DeleteRouteSchema = z.object({
    name: NameSchema
});

// ============================================================================
// Release Schemas
// ============================================================================

/**
 * Release creation schema
 */
export const CreateReleaseSchema = z.object({
    version: VersionSchema,
    description: z.string().max(1000).optional().default(''),
    status: z.enum(['draft', 'active', 'deprecated']).optional().default('draft')
});

/**
 * Release promotion schema
 */
export const PromoteReleaseSchema = z.object({
    releaseId: z.string().uuid('Invalid release ID'),
    env: z.enum(['dev', 'staging', 'prod'])
});

// ============================================================================
// Agent Schemas
// ============================================================================

/**
 * Agent request schema
 */
export const AgentRequestSchema = z.object({
    projectId: ProjectIdSchema,
    prompt: z.string().max(10000).optional(),
    instructions: z.string().max(10000).optional(),
    messages: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant', 'tool']),
        content: z.string().optional(),
        tool_call_id: z.string().optional(),
        name: z.string().optional()
    })).optional()
}).refine(
    (data) => data.prompt || data.instructions || data.messages,
    'Either prompt, instructions, or messages must be provided'
);

// ============================================================================
// Environment Schemas
// ============================================================================

/**
 * Environment creation schema
 */
export const CreateEnvSchema = z.object({
    name: NameSchema,
    image: z.string().min(1).max(256)
});

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validation result type
 */
export type ValidationResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; details?: z.ZodError };

/**
 * Validate request body against a schema
 */
export async function validateBody<T>(
    schema: z.ZodSchema<T>,
    body: unknown
): Promise<ValidationResult<T>> {
    try {
        const data = schema.parse(body);
        return { success: true, data };
    } catch (e) {
        if (e instanceof z.ZodError) {
            const firstError = e.errors[0];
            const path = firstError.path.join('.');
            const message = path 
                ? `${path}: ${firstError.message}`
                : firstError.message;
            return { success: false, error: message, details: e };
        }
        return { success: false, error: 'Validation failed' };
    }
}

/**
 * Create a validator function for a schema
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
    return (body: unknown) => validateBody(schema, body);
}

// Pre-built validators
export const validators = {
    createMFE: createValidator(CreateMFESchema),
    updateMFE: createValidator(UpdateMFESchema),
    toggleMFE: createValidator(ToggleMFESchema),
    bumpVersion: createValidator(BumpVersionSchema),
    createFunction: createValidator(CreateFunctionSchema),
    updateFunction: createValidator(UpdateFunctionSchema),
    testFunction: createValidator(TestFunctionSchema),
    createRoute: createValidator(CreateRouteSchema),
    deleteRoute: createValidator(DeleteRouteSchema),
    createRelease: createValidator(CreateReleaseSchema),
    promoteRelease: createValidator(PromoteReleaseSchema),
    agentRequest: createValidator(AgentRequestSchema),
    createEnv: createValidator(CreateEnvSchema)
};
