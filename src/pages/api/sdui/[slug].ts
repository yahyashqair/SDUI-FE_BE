import type { APIRoute } from 'astro';
import { sduiService } from '../../../services/sdui';

export const GET: APIRoute = async ({ params, request }) => {
    const { slug } = params;

    if (!slug) {
        return new Response(JSON.stringify({ error: 'Slug is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const view = await sduiService.getView(slug);

        if (!view) {
            return new Response(JSON.stringify({ error: 'View not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(view), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60, s-maxage=60'
            },
        });
    } catch (error) {
        console.error('Error fetching SDUI view:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

export const POST: APIRoute = async ({ params, request }) => {
    const { slug } = params;

    if (!slug) {
        return new Response(JSON.stringify({ error: 'Slug is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();

        // In a real app, we would validate the body against SDUIViewSchema here
        // const validation = SDUIViewSchema.safeParse(body);
        // if (!validation.success) { ... }

        await sduiService.saveView(slug, body);

        return new Response(JSON.stringify({ success: true, message: 'View saved successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error saving SDUI view:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export function getStaticPaths() {
    return [
        { params: { slug: 'home' } },
        { params: { slug: 'dashboard' } }
    ]
}
