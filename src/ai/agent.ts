
import { AITools } from './tools';
import { FileSystem } from '../db/fs';
import { ARCHITECT_PROMPT, ENGINEER_PROMPT } from './system';

// Mock OpenAI Response Structure
interface AIResponse {
    tool_calls?: {
        function: {
            name: string;
            arguments: string; // JSON string
        },
        id?: string;
    }[];
    content?: string;
}

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

const DEFINE_ROUTE_TOOL = {
    type: 'function',
    function: {
        name: 'defineRoute',
        description: 'Maps a URL path to a Micro-Frontend (MFE).',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'The URL path (e.g., /checkout)' },
                mfeName: { type: 'string', description: 'The name of the MFE to render (e.g., CheckoutMFE)' }
            },
            required: ['path', 'mfeName']
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
        description: 'Creates a Node.js serverless function.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Function name' },
                code: { type: 'string', description: 'Node.js code exporting a handler' }
            },
            required: ['name', 'code']
        }
    }
};

const FRONTEND_TOOL = {
    type: 'function',
    function: {
        name: 'createFrontendComponent',
        description: 'Creates a React Micro-Frontend (MFE).',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Component name' },
                code: { type: 'string', description: 'React component code (TSX)' }
            },
            required: ['name', 'code']
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
    DEFINE_ROUTE_TOOL,
    DB_TOOL,
    BACKEND_TOOL,
    FRONTEND_TOOL,
    ...GENERIC_TOOLS
];

// ------------------------------------------------------------------
// AI Client
// ------------------------------------------------------------------

async function callAI(history: any[], tools: any[], systemPrompt: string): Promise<AIResponse> {
    const API_KEY = import.meta.env.AI_API_KEY || process.env.AI_API_KEY || '08a365632d874dc39ecf74132dd31c7c.QkyVYKV250deAewc';
    const API_URL = import.meta.env.AI_API_URL || process.env.AI_API_URL || 'https://api.z.ai/api/coding/paas/v4/chat/completions';

    if (!API_KEY) {
        console.warn("No AI_API_KEY found, using mock.");
        return mockPlanner(history); // Use mock if no key
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
                tool_choice: tools.length > 0 ? 'auto' : undefined
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`AI API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        const choice = data.choices[0];

        return {
            content: choice.message.content,
            tool_calls: choice.message.tool_calls
        };
    } catch (e: any) {
        console.error("AI Call Failed", e);
        return { content: `Error: ${e.message}` };
    }
}

// ------------------------------------------------------------------
// Agents
// ------------------------------------------------------------------

export const ArchitectAgent = {
    process: async (projectId: string, input: string | any[]) => {
        const systemPrompt = ARCHITECT_PROMPT;

        // Handle both single prompt string and full history array
        const history = Array.isArray(input) ? input : [{ role: 'user', content: input }];

        return await callAI(history, ARCHITECT_TOOLS, systemPrompt);
    }
};

export const EngineerAgent = {
    process: async (projectId: string, input: string | any[]) => {
        // SANDBOX: Ensure we are in a unique branch to avoid breaking main
        const timestamp = new Date().getTime();
        const branchName = `ai-run-${timestamp}`;
        await AITools.gitInit(projectId);
        await AITools.gitCheckout(projectId, branchName, true);

        await FileSystem.initProject(projectId);

        const systemPrompt = ENGINEER_PROMPT; // Use strict prompt

        const logs: string[] = [];
        logs.push(`🛡️ Sandbox Mode: Created branch ${branchName}`);

        // Initialize history from input (array or single string)
        let history: any[] = Array.isArray(input) ? input : [{ role: 'user', content: input }];

        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            console.log(`[Engineer] Step ${attempts}`);

            const plan = await callAI(history, ENGINEER_TOOLS, systemPrompt);

            if (plan.content) {
                logs.push(`🤖 Engineer: ${plan.content}`);
                history.push({ role: 'assistant', content: plan.content });
            }

            if (!plan.tool_calls || plan.tool_calls.length === 0) {
                logs.push(`ℹ️ Engineer finished.`);
                break;
            }

            history.push({
                role: 'assistant',
                tool_calls: plan.tool_calls,
                content: plan.content || null
            });

            for (const call of plan.tool_calls) {
                const fnName = call.function.name;
                const args = JSON.parse(call.function.arguments);

                logs.push(`Executing: ${fnName}...`);

                let result;
                try {
                    switch (fnName) {
                        case 'readProjectContext':
                            result = await AITools.readProjectContext(projectId);
                            break;
                        case 'defineRoute':
                            result = await AITools.defineRoute(projectId, args.path, args.mfeName);
                            break;
                        case 'updateDatabaseSchema':
                            result = await AITools.updateDatabaseSchema(projectId, args.schema);
                            break;
                        case 'createBackendFunction':
                            result = await AITools.createBackendFunction(projectId, args.name, args.code);
                            break;
                        case 'createFrontendComponent':
                            result = await AITools.createFrontendComponent(projectId, args.name, args.code);
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
                    logs.push(`❌ Tool failed: ${result.error}`);
                } else {
                    logs.push(`✅ Tool success`);
                }
            }

            await FileSystem.commit(projectId, `Engineer: Step ${attempts}`);
        }

        return { success: true, logs };
    }
};

// ------------------------------------------------------------------
// Mock Planner (Simplified for brevity)
// ------------------------------------------------------------------
function mockPlanner(history: any[]): AIResponse {
    // Basic mock implementation for testing without API key
    // Returns a simple plan for "todo" app if detected
    const lastUserMsg = history.filter(h => h.role === 'user').pop();
    const prompt = (lastUserMsg?.content || '').toLowerCase();

    if (prompt.includes('todo')) {
        return {
            content: "Mock plan for Todo App",
            tool_calls: [
                {
                    function: {
                        name: 'createBackendFunction',
                        arguments: JSON.stringify({ name: 'test', code: 'module.exports = () => ({ok:true})' })
                    }
                }
            ]
        };
    }
    return { content: "Mock: I need a real API key to think." };
}
