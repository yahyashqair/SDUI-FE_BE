/**
 * Core Type Definitions
 * Centralized type definitions for the AI Development Platform
 */

// ============================================================================
// Database Types
// ============================================================================

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

// ============================================================================
// AI Types
// ============================================================================

export type AIRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIMessage {
    role: AIRole;
    content?: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    name?: string;
}

export interface ToolCall {
    id?: string;
    function: {
        name: string;
        arguments: string;
    };
}

export interface AIResponse {
    content?: string;
    tool_calls?: ToolCall[];
}

export interface ToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
}

export interface ToolExecutionContext {
    projectId: string;
    timestamp: number;
    correlationId: string;
}

// ============================================================================
// MFE Types
// ============================================================================

export interface MFEConfig {
    name: string;
    source: string;
    integrity?: string;
    version: string;
    variables: Record<string, unknown>;
    dependencies?: Record<string, string>;
    encapsulation?: 'shadow' | 'none';
    description?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MFERegistry {
    mfes: Record<string, Omit<MFEConfig, 'name'>>;
    generatedAt: string;
}

// ============================================================================
// Fission Types
// ============================================================================

export interface FissionFunction {
    name: string;
    env: string;
    executorType: string;
    namespace: string;
}

export interface FissionEnv {
    name: string;
    image: string;
    namespace: string;
}

export interface FissionRoute {
    name: string;
    method: string;
    url: string;
    function: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateFunctionRequest {
    name: string;
    code?: string;
    codePath?: string;
    env?: 'nodejs' | 'python' | 'go';
    namespace?: string;
}

export interface CreateMFERequest {
    name: string;
    source: string;
    version?: string;
    description?: string;
    active?: boolean;
    variables?: Record<string, unknown>;
}

export interface CreateRouteRequest {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    function: string;
}

export interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentType = 'architect' | 'engineer';

export interface AgentProcessResult {
    success: boolean;
    logs?: string[];
    content?: string;
    tool_calls?: ToolCall[];
    generatedCode?: Record<string, string>;
}

export interface MemoryEntry {
    timestamp: number;
    projectId: string;
    agentType: AgentType;
    action: string;
    result: unknown;
    context: unknown;
}

// ============================================================================
// Orchestrator Types
// ============================================================================

export interface OrchestratorConfig {
    projectId: string;
    requirement: string;
    maxIterations?: number;
}

export interface OrchestratorStep {
    agent: string;
    action: string;
    result: unknown;
}

export interface OrchestratorArtifacts {
    mfe?: string[];
    functions?: string[];
    routes?: string[];
    designDocs?: string[];
}

export interface OrchestratorResult {
    success: boolean;
    steps: OrchestratorStep[];
    artifacts: OrchestratorArtifacts;
    errors: string[];
}

// ============================================================================
// Release Types
// ============================================================================

export interface ReleaseDeployment {
    env: string;
    deployedAt: string;
    deployedBy: string;
}

export interface ReleaseArtifacts {
    mfes: Array<{
        name: string;
        version: string;
        source: string;
    }>;
}

export interface Release {
    id: string;
    version: string;
    description: string;
    artifacts: ReleaseArtifacts;
    status: 'draft' | 'active' | 'deprecated';
    deployments?: ReleaseDeployment[];
    created_at: string;
}
