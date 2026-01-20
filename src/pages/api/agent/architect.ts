
import type { APIRoute } from 'astro';
import { ArchitectAgent } from '../../../ai/agent';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { projectId, prompt } = await request.json();

        if (!projectId || !prompt) {
            return new Response(JSON.stringify({ error: 'projectId and prompt are required' }), { status: 400 });
        }

        const result = await ArchitectAgent.process(projectId, prompt);
        return new Response(JSON.stringify(result));
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
