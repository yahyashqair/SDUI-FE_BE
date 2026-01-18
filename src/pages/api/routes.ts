import type { APIRoute } from 'astro';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Route Registry - Auto-discovers deployed MFEs
 * Scans dist/client/mfe/ for existing components on each request
 */

/**
 * GET /api/routes?path=/some/path
 * Returns the MFE spec for the given path
 */
export const GET: APIRoute = async ({ url }) => {
    const path = url.searchParams.get('path') || '/';

    // Auto-discover MFEs from the filesystem
    const mfeDir = join(process.cwd(), 'dist', 'client', 'mfe');
    let availableMfes: string[] = [];

    try {
        availableMfes = await readdir(mfeDir);
    } catch (e) {
        // MFE directory doesn't exist yet
    }

    // Check for exact match
    // Path comes in as /my-component, we check if my-component exists in MFE dir
    const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path;

    // Handle paths with multiple segments (e.g., /products/123)
    const firstSegment = pathWithoutSlash.split('/')[0];

    if (availableMfes.includes(firstSegment)) {
        // Extract any path parameters
        const pathParts = pathWithoutSlash.split('/');
        const variables: Record<string, string> = {};

        if (pathParts.length > 1) {
            variables['id'] = pathParts[1];
            if (pathParts.length > 2) {
                variables['extra'] = pathParts.slice(2).join('/');
            }
        }

        return new Response(JSON.stringify({
            route: `/${firstSegment}`,
            mfe: {
                source: `/mfe/${firstSegment}/index.js`,
                variables
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // No match found
    return new Response(JSON.stringify({
        error: 'Route not found',
        path,
        availableMfes
    }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * POST /api/routes
 * Register a new route (for backwards compatibility)
 * Note: Routes are now auto-discovered, but this keeps API compatibility
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { pattern, source } = body;

        if (!pattern || !source) {
            return new Response(JSON.stringify({
                error: 'pattern and source are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Route is "registered" automatically when the MFE file exists
        // This endpoint just confirms the registration for API compatibility
        return new Response(JSON.stringify({
            success: true,
            message: `Route ${pattern} registered (auto-discovered from filesystem)`,
            route: { pattern, source }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
