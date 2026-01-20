
import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

/**
 * Serve Built MFE Bundles
 * GET /api/mfe/[projectId]/[component].js
 */
export const GET: APIRoute = async ({ params }) => {
    const { projectId, component } = params;

    if (!projectId || !component) {
        return new Response('Missing parameters', { status: 400 });
    }

    const distDir = path.resolve(process.cwd(), 'data', 'tenants', projectId, 'dist');
    const filePath = path.join(distDir, component); // Component usually includes .js extension in URL

    if (!fs.existsSync(filePath)) {
         return new Response(`MFE not found: ${filePath}`, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    return new Response(content, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache'
        }
    });
};
