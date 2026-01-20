
import type { APIRoute } from 'astro';
import { EngineerAgent } from '../../../ai/agent';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { projectId, instructions, messages } = await request.json();

        if (!projectId || (!instructions && !messages)) {
            return new Response(JSON.stringify({ error: 'projectId and instructions/messages are required' }), { status: 400 });
        }

        const input = messages || instructions;
        const result = await EngineerAgent.process(projectId, input);
        return new Response(JSON.stringify(result));
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
