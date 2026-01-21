/**
 * AI Agent Orchestrator
 * Coordinates architect and engineer agents for complex development tasks
 */

import { ArchitectAgent, EngineerAgent } from './agent';
import { agentMemory } from './memory';
import { aiCircuitBreaker } from './circuit-breaker';
import { analyzeGeneratedCode } from '../security/analyzer';
import { auditLog, AuditActions } from '../security/audit';
import type { 
    OrchestratorConfig, 
    OrchestratorResult, 
    OrchestratorStep,
    OrchestratorArtifacts,
    AIMessage 
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_MAX_ITERATIONS = 10;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Orchestrator
// ============================================================================

/**
 * Orchestrate a complete development workflow
 */
export async function orchestrateDevelopment(
    config: OrchestratorConfig
): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const steps: OrchestratorStep[] = [];
    const errors: string[] = [];
    const artifacts: OrchestratorArtifacts = {
        mfe: [],
        functions: [],
        routes: [],
        designDocs: []
    };
    const maxIterations = config.maxIterations || DEFAULT_MAX_ITERATIONS;

    console.log(`[Orchestrator] Starting development for project: ${config.projectId}`);
    console.log(`[Orchestrator] Requirement: ${config.requirement.substring(0, 100)}...`);

    await auditLog({
        action: AuditActions.AI_AGENT_INVOKE,
        resource: `project:${config.projectId}`,
        success: true,
        metadata: {
            type: 'orchestration_start',
            requirement: config.requirement.substring(0, 200)
        }
    });

    // Get previous context from memory
    const previousContext = agentMemory.getContext(config.projectId, { limit: 10 });

    // =========================================================================
    // Step 1: Architect creates design
    // =========================================================================
    
    try {
        console.log('[Orchestrator] Step 1: Invoking Architect agent');

        const architectMessages: AIMessage[] = [
            { 
                role: 'user', 
                content: config.requirement 
            }
        ];

        if (previousContext) {
            architectMessages.push({
                role: 'system',
                content: `Previous context:\n${previousContext}`
            });
        }

        const architectResult = await aiCircuitBreaker.execute(() =>
            ArchitectAgent.process(config.projectId, architectMessages)
        );

        steps.push({
            agent: 'architect',
            action: 'create_design',
            result: architectResult
        });

        // Save to memory
        agentMemory.save(config.projectId, {
            projectId: config.projectId,
            agentType: 'architect',
            action: 'create_design',
            result: architectResult,
            context: config.requirement
        });

        console.log('[Orchestrator] Architect completed design phase');

    } catch (e: any) {
        const error = `Architect failed: ${e.message}`;
        console.error(`[Orchestrator] ${error}`);
        errors.push(error);

        await auditLog({
            action: AuditActions.AI_AGENT_INVOKE,
            resource: `project:${config.projectId}`,
            success: false,
            metadata: { agent: 'architect', error: e.message }
        });

        return { success: false, steps, artifacts, errors };
    }

    // =========================================================================
    // Step 2: Engineer implements (with retry loop)
    // =========================================================================

    let iteration = 0;
    let implementationComplete = false;

    while (iteration < maxIterations && !implementationComplete) {
        iteration++;

        // Check timeout
        if (Date.now() - startTime > DEFAULT_TIMEOUT_MS) {
            errors.push('Orchestration timeout exceeded');
            break;
        }

        try {
            console.log(`[Orchestrator] Step 2.${iteration}: Engineer iteration`);

            const engineerMessages: AIMessage[] = [
                { 
                    role: 'user', 
                    content: config.requirement 
                },
                {
                    role: 'system',
                    content: `Previous context:\n${agentMemory.getContext(config.projectId)}`
                }
            ];

            const engineerResult = await aiCircuitBreaker.execute(() =>
                EngineerAgent.process(config.projectId, engineerMessages)
            );

            steps.push({
                agent: 'engineer',
                action: `iteration_${iteration}`,
                result: engineerResult
            });

            // Save to memory
            agentMemory.save(config.projectId, {
                projectId: config.projectId,
                agentType: 'engineer',
                action: `iteration_${iteration}`,
                result: engineerResult,
                context: config.requirement
            });

            // Check if implementation succeeded
            if (engineerResult && typeof engineerResult === 'object' && 'success' in engineerResult) {
                const result = engineerResult as { success: boolean; logs?: string[] };
                
                if (result.success) {
                    // Validate generated code if available
                    const generatedCode = extractGeneratedCode(result);
                    
                    let allCodeSafe = true;
                    for (const [name, code] of Object.entries(generatedCode)) {
                        const analysis = await analyzeGeneratedCode(code, 'typescript');
                        
                        if (!analysis.safe) {
                            const issues = analysis.issues.map(i => i.message).join(', ');
                            errors.push(`Code safety issues in ${name}: ${issues}`);
                            allCodeSafe = false;
                        } else {
                            // Track artifacts
                            if (name.includes('frontend') || name.endsWith('.tsx')) {
                                artifacts.mfe?.push(name);
                            } else if (name.endsWith('.js') || name.includes('function')) {
                                artifacts.functions?.push(name);
                            }
                        }
                    }

                    if (allCodeSafe && errors.length === 0) {
                        implementationComplete = true;
                        console.log(`[Orchestrator] Engineer completed after ${iteration} iterations`);
                    }
                }
            }

        } catch (e: any) {
            const error = `Engineer iteration ${iteration} failed: ${e.message}`;
            console.error(`[Orchestrator] ${error}`);
            errors.push(error);

            await auditLog({
                action: AuditActions.AI_AGENT_INVOKE,
                resource: `project:${config.projectId}`,
                success: false,
                metadata: { 
                    agent: 'engineer', 
                    iteration, 
                    error: e.message 
                }
            });
        }
    }

    // =========================================================================
    // Finalize
    // =========================================================================

    const success = implementationComplete && errors.length === 0;
    const duration = Date.now() - startTime;

    console.log(`[Orchestrator] Completed in ${duration}ms, success: ${success}`);

    await auditLog({
        action: AuditActions.AI_AGENT_INVOKE,
        resource: `project:${config.projectId}`,
        success,
        metadata: {
            type: 'orchestration_complete',
            duration,
            iterations: iteration,
            artifactCount: Object.values(artifacts).flat().length,
            errorCount: errors.length
        }
    });

    return { success, steps, artifacts, errors };
}

/**
 * Extract generated code from engineer result
 */
function extractGeneratedCode(result: any): Record<string, string> {
    const code: Record<string, string> = {};

    // Check for direct generatedCode property
    if (result.generatedCode && typeof result.generatedCode === 'object') {
        return result.generatedCode;
    }

    // Extract from logs if present
    if (result.logs && Array.isArray(result.logs)) {
        for (const log of result.logs) {
            // Look for patterns like "Created file: path/to/file.ts"
            const match = log.match(/(?:Created|Updated|Wrote)\s+(?:file:?\s*)?([^\s]+)/i);
            if (match) {
                code[match[1]] = ''; // We don't have the actual code from logs
            }
        }
    }

    return code;
}

/**
 * Simple orchestration for single-step tasks
 */
export async function quickOrchestrate(
    projectId: string,
    task: string,
    agentType: 'architect' | 'engineer' = 'engineer'
): Promise<{
    success: boolean;
    result: unknown;
    error?: string;
}> {
    try {
        const agent = agentType === 'architect' ? ArchitectAgent : EngineerAgent;
        
        const result = await aiCircuitBreaker.execute(async () => {
            return agent.process(projectId, task);
        });

        agentMemory.save(projectId, {
            projectId,
            agentType,
            action: 'quick_task',
            result,
            context: task
        });

        return { success: true, result };

    } catch (e: unknown) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        return { 
            success: false, 
            result: null, 
            error 
        };
    }
}

/**
 * Get orchestration status and history for a project
 */
export function getOrchestrationHistory(projectId: string): {
    entries: any[];
    summary: any;
} {
    const entries = agentMemory.getAll(projectId);
    const summary = agentMemory.getSummary(projectId);

    return { entries, summary };
}
