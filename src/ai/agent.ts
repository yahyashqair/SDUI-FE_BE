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

// Tool Definitions for OpenAI
const TOOLS_SCHEMA: any[] = [
    {
        type: 'function',
        function: {
            name: 'updateDatabaseSchema',
            description: 'Updates the SQLite database schema for the project based on the application requirements.',
            parameters: {
                type: 'object',
                properties: {
                    schema: {
                        type: 'object',
                        description: 'The JSON schema definition for the database tables.',
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
    },
    {
        type: 'function',
        function: {
            name: 'createBackendFunction',
            description: 'Creates or updates a Node.js backend serverless function.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'The name of the function (e.g., getTasks)' },
                    code: { type: 'string', description: 'The complete Node.js code for the function. Must export a handler.' }
                },
                required: ['name', 'code']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'createFrontendComponent',
            description: 'Creates or updates a React Micro-Frontend (MFE) component.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'The name of the component (e.g., TaskItem)' },
                    code: { type: 'string', description: 'The complete React component code (TSX).' }
                },
                required: ['name', 'code']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'updateUILayout',
            description: 'Updates the Server-Driven UI (SDUI) layout schema.',
            parameters: {
                type: 'object',
                properties: {
                    layout: { type: 'object', description: 'The JSON hierarchy for the UI.' }
                },
                required: ['layout']
            }
        }
    }
];

// OpenAI Client
async function callAI(history: any[]): Promise<AIResponse> {
    const API_KEY = process.env.AI_API_KEY;
    const API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';

    if (!API_KEY) {
        console.warn("No AI_API_KEY found, falling back to mock planner for safety.");
        return mockPlanner(history);
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Or usage-defined
                messages: [
                    { role: 'system', content: 'You are an expert full-stack developer building a serverless app. You have access to tools to modify the database, backend functions, and frontend components. Use them to build what the user asks.' },
                    ...history.map(h => {
                        // Simplify history for the API to avoid errors if extra fields exist
                        if (h.role === 'tool') {
                            return { role: 'tool', tool_call_id: h.tool_call_id, name: h.name, content: h.content };
                        }
                        if (h.role === 'assistant') {
                            return { role: 'assistant', content: h.content, tool_calls: h.tool_calls };
                        }
                        return { role: h.role, content: h.content };
                    })
                ],
                tools: TOOLS_SCHEMA,
                tool_choice: 'auto'
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
        // Fallback to mock if API fails? Or just return error content
        return { content: `Error calling AI: ${e.message}` };
    }
}

/**
 * Mock Planner - Fallback
 */
function mockPlanner(history: any[]): AIResponse {
    // Get the last user message to determine current intent
    const lastUserMsg = history.filter(h => h.role === 'user').pop();
    const prompt = lastUserMsg ? lastUserMsg.content : '';
    const p = prompt.toLowerCase();

    // Check for previous errors in history to simulate "Fixing"
    const lastToolResult = history[history.length - 1];
    if (lastToolResult && lastToolResult.role === 'tool' && !JSON.parse(lastToolResult.content).success) {
        // SIMULATION: If we see an error, try to fix it.
        // For verified demo purposes, if we see a build error in TaskItem, we re-issue the createFrontendComponent with "fixed" code.
        const errorContent = JSON.parse(lastToolResult.content);
        if (errorContent.error && errorContent.error.includes('build failed')) {
            return {
                tool_calls: [{
                    function: {
                        name: 'createFrontendComponent',
                        arguments: JSON.stringify({
                            name: 'TaskItem',
                            code: `import React from 'react';
// Fixed version without syntax errors
export default function TaskItem({ task, onToggle }) {
    return (
        <div style={{ padding: '10px' }}>
            {task.title}
        </div>
    );
}`                        })
                    }
                }]
            };
        }
    }

    // Scenario: "Todo App"
    if (p.includes('todo') || p.includes('task')) {
        return {
            tool_calls: [
                {
                    function: {
                        name: 'updateDatabaseSchema',
                        arguments: JSON.stringify({
                            schema: {
                                tables: [{
                                    name: 'tasks',
                                    columns: [
                                        { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
                                        { name: 'title', type: 'TEXT' },
                                        { name: 'completed', type: 'BOOLEAN DEFAULT 0' }
                                    ]
                                }]
                            }
                        })
                    }
                },
                {
                    function: {
                        name: 'createBackendFunction',
                        arguments: JSON.stringify({
                            name: 'getTasks',
                            code: `
const db = require('./lib/db');
module.exports = async () => db.query("SELECT * FROM tasks");
                            `
                        })
                    }
                },
                {
                    function: {
                        name: 'createBackendFunction',
                        arguments: JSON.stringify({
                            name: 'addTask',
                            code: `
const db = require('./lib/db');
module.exports = async (params) => {
    db.query("INSERT INTO tasks (title) VALUES (?)", params.title);
    return { success: true };
}
                            `
                        })
                    }
                },
                {
                    function: {
                        name: 'createFrontendComponent',
                        arguments: JSON.stringify({
                            name: 'TaskItem',
                            code: `
import React from 'react';

// A Micro Frontend Component for a Task Item
export default function TaskItem({ task, onToggle }) {
    return (
        <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                {task.title}
            </span>
            <button onClick={() => onToggle(task.id)} style={{ fontSize: '12px' }}>
                {task.completed ? 'Undo' : 'Done'}
            </button>
        </div>
    );
}
                            `
                        })
                    }
                },
                {
                    function: {
                        name: 'updateUILayout',
                        arguments: JSON.stringify({
                            layout: {
                                type: 'container',
                                props: { className: 'p-8 max-w-md mx-auto' },
                                children: [
                                    { type: 'hero', props: { title: 'AI Todo List' } },
                                    {
                                        type: 'input',
                                        props: { name: 'newTask', placeholder: 'New Task' }
                                    },
                                    {
                                        type: 'button',
                                        props: {
                                            label: 'Add',
                                            action: {
                                                type: 'server',
                                                functionName: 'addTask',
                                                collectValues: ['newTask'],
                                                onSuccess: 'refresh'
                                            }
                                        }
                                    },
                                    {
                                        type: 'list',
                                        props: {
                                            itemsSource: { type: 'server', functionName: 'getTasks' },
                                            itemTemplate: {
                                                type: 'remote-mfe',
                                                props: {
                                                    source: '/api/mfe/{projectId}/TaskItem.js',
                                                    task: '{item}', // Pass the whole item as prop
                                                    onToggle: { // Logic for actions inside MFE is tricky via JSON, usually we pass a callback ID or similar.
                                                        // For this demo, let's keep it simple.
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        })
                    }
                }
            ]
        };
    }

    return { content: "I don't know how to build that yet." };
}

export const Agent = {
    process: async (projectId: string, prompt: string) => {
        console.log(`[Agent] Processing prompt: "${prompt}" for project ${projectId}`);

        // 1. Initialize Git/FS if new
        await FileSystem.initProject(projectId);

        const logs: string[] = [];
        let history: any[] = [{ role: 'user', content: prompt }];
        let attempts = 0;
        const MAX_ATTEMPTS = 3;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            console.log(`[Agent] Attempt ${attempts}/${MAX_ATTEMPTS}`);

            // 2. "Think" - Get Plan (Mock or Real)
            // We pass the full history so the "AI" sees previous errors
            const plan = await callAI(history);

            if (plan.content) {
                logs.push(`🤖 AI: ${plan.content}`);
                history.push({ role: 'assistant', content: plan.content });
            }

            if (!plan.tool_calls || plan.tool_calls.length === 0) {
                logs.push(`ℹ️ AI finished or gave up after ${attempts} attempts.`);
                break;
            }

            // Record assistant intent to call tools
            history.push({
                role: 'assistant',
                tool_calls: plan.tool_calls,
                content: plan.content || null
            });

            // 3. Execute Tools
            let hasErrors = false;

            for (const call of plan.tool_calls) {
                const fnName = call.function.name;
                const args = JSON.parse(call.function.arguments);

                logs.push(`Calling tool: ${fnName}...`);
                console.log(`[Agent] Executing ${fnName}`);

                let result;
                try {
                    switch (fnName) {
                        case 'updateDatabaseSchema':
                            result = await AITools.updateDatabaseSchema(projectId, args.schema);
                            break;
                        case 'createBackendFunction':
                            result = await AITools.createBackendFunction(projectId, args.name, args.code);
                            break;
                        case 'createFrontendComponent':
                            result = await AITools.createFrontendComponent(projectId, args.name, args.code);
                            break;
                        case 'updateUILayout':
                            result = await AITools.updateUILayout(projectId, args.layout);
                            break;
                        default:
                            result = { success: false, error: `Unknown tool: ${fnName}` };
                    }
                } catch (e: any) {
                    result = { success: false, error: e.message };
                }

                if (result?.success) {
                    logs.push(`✓ Tool ${fnName} succeeded.`);
                    // Feedback to AI: Success
                    history.push({
                        role: 'tool',
                        tool_call_id: call.id || 'mock_id', // Handle mock case where ID is missing
                        name: fnName,
                        content: JSON.stringify({ success: true, data: result.data })
                    });
                } else {
                    hasErrors = true;
                    const errorMsg = result?.error || 'Unknown error';
                    logs.push(`✗ Tool ${fnName} failed: ${errorMsg}`);

                    // Feedback to AI: Failure with details!
                    // This is the key "Feedback Loop" requested
                    history.push({
                        role: 'tool',
                        tool_call_id: call.id || 'mock_id',
                        name: fnName,
                        content: JSON.stringify({ success: false, error: errorMsg })
                    });
                }
            }

            // 4. Commit Changes (Checkpoint)
            await FileSystem.commit(projectId, `AI Agent: Attempt ${attempts}`);

            if (!hasErrors) {
                logs.push('✨ All steps completed successfully.');
                break;
            } else {
                logs.push('⚠️ Errors detected. AI will attempt to fix...');
                // The loop continues, 'mockPlanner' (or real LLM) will be called again with the error history
            }
        }

        if (attempts >= MAX_ATTEMPTS) {
            logs.push('❌ Max attempts reached. Some tasks may have failed.');
        }

        return { success: true, logs };
    }
};

// Backward compatibility export
export const generateApp = async (prompt: string) => {
    return { uiSchema: {}, dataSchema: {}, functions: [] };
}
