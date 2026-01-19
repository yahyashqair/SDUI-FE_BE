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
import type { APIRoute } from 'astro';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Route Registry - Reads from mfe-registry.json
 */
export const GET: APIRoute = async ({ url }) => {
    const path = url.searchParams.get('path') || '/';

    // Read registry
    const registryPath = join(process.cwd(), 'public', 'mfe', 'mfe-registry.json');
    let registry: any = { mfes: {} };

    try {
        const fileContent = await readFile(registryPath, 'utf-8');
        registry = JSON.parse(fileContent);
    } catch (e) {
        console.error('Failed to read MFE registry', e);
        // Fallback or empty
    }

    const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path;
    const firstSegment = pathWithoutSlash.split('/')[0];

    // Check availability in registry
    if (registry.mfes[firstSegment]) {
        const mfeDef = registry.mfes[firstSegment];

        // Extract any path parameters
        const pathParts = pathWithoutSlash.split('/');
        const variables: Record<string, string> = { ...mfeDef.variables };

        if (pathParts.length > 1) {
            variables['id'] = pathParts[1];
        }

        return new Response(JSON.stringify({
            route: `/${firstSegment}`,
            mfe: {
                name: firstSegment,
                source: mfeDef.source,
                integrity: mfeDef.integrity,
                variables,
                version: mfeDef.version
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
        availableMfes: Object.keys(registry.mfes)
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
