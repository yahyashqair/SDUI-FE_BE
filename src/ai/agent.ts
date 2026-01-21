
import { AITools } from './tools';
import { FileSystem } from '../db/fs';
import { ARCHITECT_PROMPT, ENGINEER_PROMPT } from './system';

// Mock OpenAI Response Structure
interface AIResponse {
    tool_calls?: {
        id?: string;
        type: 'function';
        function: {
            name: string;
            arguments: string; // JSON string
        },
    }[];
    content?: string;
}

export type StreamEvent =
    | { type: 'token'; content: string }
    | { type: 'tool_start'; tool: string; args: any }
    | { type: 'log'; content: string }
    | { type: 'tool_end'; tool: string; result: any }
    | { type: 'error'; error: string }
    | { type: 'done' };

// ------------------------------------------------------------------
// Tool Definitions
// ------------------------------------------------------------------

const READ_CONTEXT_TOOL = {
    type: 'function',
    function: {
        name: 'readProjectContext',
        description: 'Reads the current project file structure and key configuration files.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    }
};

const DB_TOOL = {
    type: 'function',
    function: {
        name: 'updateDatabaseSchema',
        description: 'Updates the SQLite database schema.',
        parameters: {
            type: 'object',
            properties: {
                schema: {
                    type: 'object',
                    description: 'The JSON schema definition for tables.',
                    properties: {
                        tables: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    columns: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                type: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            required: ['schema']
        }
    }
};

const BACKEND_TOOL = {
    type: 'function',
    function: {
        name: 'createBackendFunction',
        description: 'Creates a file in the backend service following DDD architecture.',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Relative path in backend src (e.g., domain/user.ts)' },
                code: { type: 'string', description: 'TypeScript code' }
            },
            required: ['path', 'code']
        }
    }
};

const FRONTEND_TOOL = {
    type: 'function',
    function: {
        name: 'createFrontendComponent',
        description: 'Creates a file in the frontend remote module.',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Relative path in frontend src (e.g., components/Button.tsx)' },
                code: { type: 'string', description: 'React component code (TSX)' }
            },
            required: ['path', 'code']
        }
    }
};

const VERIFY_TOOL = {
    type: 'function',
    function: {
        name: 'runVerificationGate',
        description: 'Runs the Verification Gate to check architecture, tests, and build.',
        parameters: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['backend', 'frontend'] }
            },
            required: ['type']
        }
    }
};

const WRITE_DESIGN_TOOL = {
    type: 'function',
    function: {
        name: 'writeDesignDocument',
        description: 'Writes a design document (ADR, Diagram, README) to the design/ folder.',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Relative path in design/ folder (e.g., adr/001-init.md)' },
                content: { type: 'string', description: 'Markdown content' }
            },
            required: ['path', 'content']
        }
    }
};


const GENERIC_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'searchFiles',
            description: 'Search for files matching a pattern or content',
            parameters: { type: 'object', properties: { query: { type: 'string' }, path: { type: 'string' } }, required: ['query'] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'readFile',
            description: 'Read file content',
            parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'editFile',
            description: 'Edit file content',
            parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'runCommand',
            description: 'Run a shell command (SAFE MODE)',
            parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'gitInit',
            description: 'Initialize a git repository',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'gitCheckout',
            description: 'Checkout a branch (creates if new)',
            parameters: { type: 'object', properties: { branch: { type: 'string' }, create: { type: 'boolean' } }, required: ['branch'] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'gitCommit',
            description: 'Commit changes',
            parameters: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] }
        }
    }
];

// specialized toolsets
const ARCHITECT_TOOLS = [READ_CONTEXT_TOOL, WRITE_DESIGN_TOOL, ...GENERIC_TOOLS];
const ENGINEER_TOOLS = [
    READ_CONTEXT_TOOL,
    DB_TOOL,
    BACKEND_TOOL,
    FRONTEND_TOOL,
    VERIFY_TOOL,
    ...GENERIC_TOOLS
];

// ------------------------------------------------------------------
// AI Client
// ------------------------------------------------------------------

async function* streamAI(history: any[], tools: any[], systemPrompt: string): AsyncGenerator<AIResponse | { partial: string }> {
    const API_KEY = import.meta.env.AI_API_KEY || process.env.AI_API_KEY;
    const API_URL = import.meta.env.AI_API_URL || process.env.AI_API_URL || 'https://api.z.ai/api/coding/paas/v4/chat/completions';

    if (!API_KEY) {
        console.warn("No AI_API_KEY found, using mock.");
        yield mockPlanner(history); // Use mock if no key
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'GLM-4.7',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.map(h => {
                        if (h.role === 'tool') {
                            return { role: 'tool', tool_call_id: h.tool_call_id, name: h.name, content: h.content };
                        }
                        if (h.role === 'assistant') {
                            return { role: 'assistant', content: h.content, tool_calls: h.tool_calls };
                        }
                        return { role: h.role, content: h.content };
                    })
                ],
                tools: tools.length > 0 ? tools : undefined,
                tool_choice: tools.length > 0 ? 'auto' : undefined,
                stream: true
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`AI API Error: ${response.status} ${err}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // State for accumulating tool calls
        let currentToolCalls: any[] = [];
        let currentContent = '';

        if (!reader) throw new Error("No response body");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === 'data: [DONE]') continue;
                if (!line.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(line.slice(6));
                    const delta = json.choices[0].delta;

                    if (delta.content) {
                        currentContent += delta.content;
                        yield { partial: delta.content };
                    }

                    if (delta.tool_calls) {
                        for (const toolCall of delta.tool_calls) {
                            const index = toolCall.index;
                            if (!currentToolCalls[index]) {
                                currentToolCalls[index] = {
                                    id: toolCall.id,
                                    type: 'function',
                                    function: { name: '', arguments: '' }
                                };
                            }
                            if (toolCall.function?.name) {
                                currentToolCalls[index].function.name += toolCall.function.name;
                            }
                            if (toolCall.function?.arguments) {
                                currentToolCalls[index].function.arguments += toolCall.function.arguments;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error parsing SSE:", e);
                }
            }
        }

        // Return finalized result
        yield {
            content: currentContent,
            tool_calls: currentToolCalls.length > 0 ? currentToolCalls : undefined
        } as AIResponse;

    } catch (e: any) {
        console.error("AI Call Failed", e);
        throw e;
    }
}

// ------------------------------------------------------------------
// Agents
// ------------------------------------------------------------------

export const ArchitectAgent = {
    process: async function* (projectId: string, input: string | any[]): AsyncGenerator<StreamEvent> {
        const systemPrompt = ARCHITECT_PROMPT;
        const history = Array.isArray(input) ? input : [{ role: 'user', content: input }];

        try {
            const generator = streamAI(history, ARCHITECT_TOOLS, systemPrompt);
            for await (const chunk of generator) {
                if ('partial' in chunk) {
                    yield { type: 'token', content: chunk.partial };
                }
            }
            yield { type: 'done' };
        } catch (e: any) {
            yield { type: 'error', error: e.message };
        }
    }
};

export const EngineerAgent = {
    process: async function* (projectId: string, input: string | any[]): AsyncGenerator<StreamEvent> {
        // SANDBOX: Ensure we are in a unique branch to avoid breaking main
        const timestamp = new Date().getTime();
        const branchName = `ai-run-${timestamp}`;

        yield { type: 'log', content: `🛡️ Sandbox Mode: Created branch ${branchName}` };

        await AITools.gitInit(projectId);
        await AITools.gitCheckout(projectId, branchName, true);
        await FileSystem.initProject(projectId);

        const systemPrompt = ENGINEER_PROMPT;
        let history: any[] = Array.isArray(input) ? input : [{ role: 'user', content: input }];

        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            yield { type: 'log', content: `[Engineer] Step ${attempts}` };

            const generator = streamAI(history, ENGINEER_TOOLS, systemPrompt);
            let fullResponse: AIResponse = {};

            for await (const chunk of generator) {
                if ('partial' in chunk) {
                    yield { type: 'token', content: chunk.partial };
                } else {
                    fullResponse = chunk;
                }
            }

            const plan = fullResponse;

            if (plan.content) {
                history.push({ role: 'assistant', content: plan.content });
            }

            if (!plan.tool_calls || plan.tool_calls.length === 0) {
                yield { type: 'log', content: `ℹ️ Engineer finished.` };
                break;
            }

            history.push({
                role: 'assistant',
                tool_calls: plan.tool_calls,
                content: plan.content || null
            });

            for (const call of plan.tool_calls) {
                const fnName = call.function.name;
                const argsStr = call.function.arguments;
                let args;
                try {
                    args = JSON.parse(argsStr);
                } catch (e) {
                    yield { type: 'log', content: `Error parsing args for ${fnName}: ${argsStr}` };
                    continue;
                }

                yield { type: 'tool_start', tool: fnName, args };

                let result;
                try {
                    switch (fnName) {
                        case 'readProjectContext':
                            result = await AITools.readProjectContext(projectId);
                            break;
                        case 'updateDatabaseSchema':
                            result = await AITools.updateDatabaseSchema(projectId, args.schema);
                            break;
                        case 'createBackendFunction':
                            result = await AITools.createBackendFunction(projectId, args.path, args.code);
                            break;
                        case 'createFrontendComponent':
                            result = await AITools.createFrontendComponent(projectId, args.path, args.code);
                            break;
                        case 'runVerificationGate':
                            result = await AITools.runVerificationGate(projectId, args.type);
                            break;
                        case 'writeDesignDocument':
                            result = await AITools.writeDesignDocument(projectId, args.path, args.content);
                            break;
                        case 'searchFiles':
                            result = await AITools.searchFiles(projectId, args.query, args.path);
                            break;
                        case 'readFile':
                            result = await AITools.readFile(projectId, args.path);
                            break;
                        case 'editFile':
                            result = await AITools.editFile(projectId, args.path, args.content);
                            break;
                        case 'runCommand':
                            result = await AITools.runCommand(projectId, args.command);
                            break;
                        case 'gitInit':
                            result = await AITools.gitInit(projectId);
                            break;
                        case 'gitCheckout':
                            result = await AITools.gitCheckout(projectId, args.branch, args.create);
                            break;
                        case 'gitCommit':
                            result = await AITools.gitCommit(projectId, args.message);
                            break;
                        default:
                            result = { success: false, error: `Unknown tool: ${fnName}` };
                    }
                } catch (e: any) {
                    result = { success: false, error: e.message };
                }

                history.push({
                    role: 'tool',
                    tool_call_id: call.id || 'mock_id',
                    name: fnName,
                    content: JSON.stringify(result)
                });

                if (!result.success) {
                    yield { type: 'log', content: `❌ Tool failed: ${result.error}` };
                } else {
                    yield { type: 'log', content: `✅ Tool success` };
                }

                yield { type: 'tool_end', tool: fnName, result };
            }

            await FileSystem.commit(projectId, `Engineer: Step ${attempts}`);
        }

        yield { type: 'done' };
    }
};

// ------------------------------------------------------------------
// Mock Planner (Simplified for brevity)
// ------------------------------------------------------------------
function mockPlanner(history: any[]): AIResponse {
    const lastUserMsg = history.filter(h => h.role === 'user').pop();
    const prompt = (lastUserMsg?.content || '').toLowerCase();

    if (prompt.includes('todo')) {
        return {
            content: "Mock plan for Todo App",
            tool_calls: [
                {
                    id: 'call_mock_1',
                    type: 'function',
                    function: {
                        name: 'createBackendFunction',
                        arguments: JSON.stringify({ path: 'src/domain/todo.ts', code: 'export class Todo {}' })
                    }
                }
            ]
        };
    }
    return { content: "Mock: I need a real API key to think." };
}
