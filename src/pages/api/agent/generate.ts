import type { APIRoute } from 'astro';
import { FileSystem } from '../../../db/fs';
import path from 'path';

/**
 * System prompt that instructs the AI to generate React components
 * using React.createElement syntax for direct browser execution.
 */
const BASE_SYSTEM_PROMPT = `You are an expert React developer that generates web components.

## OUTPUT FORMAT
You MUST output ONLY valid JavaScript code. No markdown, no explanations, no code fences.
The code must be a single ES module that default exports a React function component.
If you introduce a NEW dependency, you MUST add a comment at the very top: // REQUIRES: <package-name>

## TECHNICAL REQUIREMENTS
1. Use \`React.createElement\` (aliased as \`h\`) - NOT JSX
2. Access React from \`window.React\`: \`const { useState, useEffect } = window.React;\`
3. The component receives a \`context\` prop with: { variables, navigate, callAPI, globalState, setGlobalState }
4. Use inline styles with JavaScript objects
5. Make the design modern, colorful, and professional

## EXAMPLE OUTPUT
// REQUIRES: canvas-confetti
const { useState, useEffect } = window.React;
const h = window.React.createElement;

export default function MyComponent({ context }) {
    const [data, setData] = useState(null);
    
    return h('div', { style: { padding: '2rem' } },
        h('h1', { style: { fontSize: '2rem', fontWeight: 'bold' } }, 'Hello World'),
        h('p', null, 'This is a dynamically generated component.')
    );
}

## DESIGN GUIDELINES
- Use gradient backgrounds for cards: \`background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'\`
- Use modern shadows: \`boxShadow: '0 10px 40px rgba(0,0,0,0.1)'\`
- Use border-radius: \`borderRadius: '12px'\`
- Use system fonts: \`fontFamily: 'system-ui, sans-serif'\`
- Make it responsive with flexbox/grid
- Add hover states via onMouseEnter/onMouseLeave if needed

Now generate the component based on the user's request. Output ONLY the JavaScript code, nothing else.`;

/**
 * POST /api/agent/generate
 * Streaming endpoint for AI-powered component generation
 */
export const POST: APIRoute = async ({ request }) => {
    const { prompt, projectId, model = 'GLM-4.7' } = await request.json();

    if (!prompt) {
        return new Response(JSON.stringify({ error: 'prompt is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Get API key from environment
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let projectContext = '';
    if (projectId) {
        try {
            const files = FileSystem.listFiles(projectId);
            // Limit file list to top 50 to avoid token overflow
            const fileList = files.slice(0, 50).map(f => `- ${f.path} (${f.type})`).join('\n');

            // Try to read package.json
            let pkgJson = '{}';
            try {
                pkgJson = FileSystem.readFile(projectId, 'package.json');
            } catch { }

            let depList = 'None';
            try {
                const pkg = JSON.parse(pkgJson);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                depList = Object.keys(deps).join(', ');
            } catch { }

            projectContext = `
## PROJECT CONTEXT
You are working in an existing project with ID: ${projectId}.
Files:
${fileList}

Installed Dependencies:
${depList}

If you need to use a library, PREFER existing dependencies.
`;
        } catch (e) {
            console.error("Failed to load context", e);
        }
    }

    const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + projectContext;

    // Call OpenAI-compatible API with streaming
    const response = await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        const error = await response.text();
        return new Response(JSON.stringify({ error: `OpenAI API error: ${error}` }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Stream the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
        async start(controller) {
            const reader = response.body?.getReader();
            if (!reader) {
                controller.close();
                return;
            }

            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                controller.close();
                                return;
                            }

                            try {
                                const json = JSON.parse(data);
                                const content = json.choices?.[0]?.delta?.content;
                                if (content) {
                                    controller.enqueue(encoder.encode(content));
                                }
                            } catch (e) {
                                // Ignore parse errors for incomplete chunks
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
};
