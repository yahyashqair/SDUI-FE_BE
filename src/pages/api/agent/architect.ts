
import type { APIRoute } from 'astro';
import { ArchitectAgent } from '../../../ai/agent';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { projectId, prompt, messages } = await request.json();

        if (!projectId || (!prompt && !messages)) {
            return new Response(JSON.stringify({ error: 'projectId and prompt/messages are required' }), { status: 400 });
        }

        const input = messages || prompt;
        const generator = ArchitectAgent.process(projectId, input);

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
