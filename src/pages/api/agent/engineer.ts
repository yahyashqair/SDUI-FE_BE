
import type { APIRoute } from 'astro';
import { EngineerAgent } from '../../../ai/agent';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { projectId, instructions, messages } = await request.json();

        if (!projectId || (!instructions && !messages)) {
            return new Response(JSON.stringify({ error: 'projectId and instructions/messages are required' }), { status: 400 });
        }

        const input = messages || instructions;
        const generator = EngineerAgent.process(projectId, input);

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const event of generator) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                    }
                } catch (e: any) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
