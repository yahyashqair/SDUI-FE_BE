
import type { APIRoute } from 'astro';
import { EngineerAgent } from '../../../ai/agent';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { projectId, instructions } = await request.json();

        if (!projectId || !instructions) {
            return new Response(JSON.stringify({ error: 'projectId and instructions are required' }), { status: 400 });
        }

        const result = await EngineerAgent.process(projectId, instructions);
        return new Response(JSON.stringify(result));
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
