
import { AITools } from './tools';
import { FileSystem } from '../db/fs';

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

// specialized toolsets
const ARCHITECT_TOOLS = [READ_CONTEXT_TOOL];
const ENGINEER_TOOLS = [
    READ_CONTEXT_TOOL,
    DEFINE_ROUTE_TOOL,
    DB_TOOL,
    BACKEND_TOOL,
    FRONTEND_TOOL
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
    process: async (projectId: string, prompt: string) => {
        const systemPrompt = `You are a Senior Software Architect. 
Your goal is to design a robust microservices and micro-frontend architecture based on the user's request.
1. Analyze the requirements.
2. checking existing project context using 'readProjectContext'.
3. Propose a design including: 
    - Micro-Frontends (MFEs) needed
    - Backend Services (Functions) needed
    - Database Schema changes
    - Routes
Output your design as a clear markdown document. Do NOT write code yet.`;

        const history = [{ role: 'user', content: prompt }];
        // Only read context allowed for Architect
        return await callAI(history, ARCHITECT_TOOLS, systemPrompt);
    }
};

export const EngineerAgent = {
    process: async (projectId: string, instructions: string) => {
        await FileSystem.initProject(projectId);

        const systemPrompt = `You are a Senior Software Engineer.
Your goal is to IMPLEMENT the architecture designed by the Architect.
You have access to tools to create DB schemas, backend functions, and frontend components.
Follow the instructions precisely.`;

        const logs: string[] = [];
        let history: any[] = [{ role: 'user', content: instructions }];
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
