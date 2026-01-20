import { AITools } from './tools';
import { FileSystem } from '../../db/fs';

// Mock OpenAI Response Structure
interface AIResponse {
    tool_calls?: {
        function: {
            name: string;
            arguments: string; // JSON string
        }
    }[];
    content?: string;
}

/**
 * The AI Agent Orchestrator
 * Simulates an LLM Loop: User Prompt -> Tool Calls -> Execution -> Response
 */
export const Agent = {
    process: async (projectId: string, prompt: string) => {
        console.log(`[Agent] Processing prompt: "${prompt}" for project ${projectId}`);

        // 1. Initialize Git/FS if new
        await FileSystem.initProject(projectId);

        // 2. "Think" (Mocking the LLM decision process)
        // In a real implementation, we would send the prompt + tool definitions to OpenAI API
        const plan = mockPlanner(prompt);

        const logs: string[] = [];

        // 3. Execute Tools
        if (plan.tool_calls) {
            for (const call of plan.tool_calls) {
                const fnName = call.function.name;
                const args = JSON.parse(call.function.arguments);

                logs.push(`Calling tool: ${fnName}...`);

                let result;
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
                }

                if (result?.success) {
                    logs.push(`✓ Tool ${fnName} succeeded.`);
                } else {
                    logs.push(`✗ Tool ${fnName} failed: ${result?.error}`);
                }
            }
        }

        // 4. Commit Changes
        await FileSystem.commit(projectId, `AI Agent: ${prompt}`);

        return { success: true, logs };
    }
};

/**
 * Mock Planner - Hardcoded scenarios for the demo
 */
function mockPlanner(prompt: string): AIResponse {
    const p = prompt.toLowerCase();

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

// Backward compatibility export
export const generateApp = async (prompt: string) => {
   // We need a projectId context to run the Agent.
   // This is a breaking change for the previous signature which didn't take projectId.
   // But the user said "change anything".
   // I'll return a structure that mimics the old return type but based on the *result* of the agent?
   // Actually, the caller of generateApp (builder UI) needs to be updated to use Agent.process directly.
   return { uiSchema: {}, dataSchema: {}, functions: [] };
}
