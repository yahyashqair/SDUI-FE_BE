import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * POST /api/agent/deploy
 * Deploys a generated component to the MFE directory and registers the route
 * 
 * In SSR mode, we write to both:
 * - dist/client/mfe/ (for immediate serving)
 * - public/mfe/ (for persistence across rebuilds)
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const { code, route, name } = await request.json();

        if (!code || !route || !name) {
            return new Response(JSON.stringify({
                error: 'code, route, and name are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Sanitize the name for filesystem
        const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const mfePath = `/mfe/${safeName}`;

        // Write to BOTH directories for immediate serving + persistence
        const distDir = join(process.cwd(), 'dist', 'client', 'mfe', safeName);
        const publicDir = join(process.cwd(), 'public', 'mfe', safeName);

        // Create directories
        await mkdir(distDir, { recursive: true });
        await mkdir(publicDir, { recursive: true });

        // Write the component to both locations
        await writeFile(join(distDir, 'index.js'), code, 'utf-8');
        await writeFile(join(publicDir, 'index.js'), code, 'utf-8');

        // Register the route
        const registryResponse = await fetch(new URL('/api/routes', request.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pattern: route,
                source: `${mfePath}/index.js`,
                variables: {}
            })
        });

        if (!registryResponse.ok) {
            const error = await registryResponse.text();
            return new Response(JSON.stringify({
                error: `Failed to register route: ${error}`
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Component deployed successfully`,
            route,
            mfePath: `${mfePath}/index.js`,
            previewUrl: `/app${route}`
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({
            error: `Deployment failed: ${e instanceof Error ? e.message : 'Unknown error'}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
