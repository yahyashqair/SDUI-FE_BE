/**
 * Master App API - Control Plane Endpoints
 * Fission function that provides the Master App API
 */

// NOTE: This runs as a Fission function
// Deploy with: fission function create --name master-api --env nodejs --code master-api.js

const mfeManager = require('./mfe-manager-runtime');
const fissionClient = require('./fission-client-runtime');

module.exports = async function (context) {
    const method = context.request.method;
    const path = context.request.url || '';
    const body = context.request.body || {};
    const query = context.request.query || {};

    // Parse action from path or query
    const action = query.action || 'list';
    const resource = query.resource || 'mfe';

    try {
        // MFE Management
        if (resource === 'mfe') {
            switch (action) {
                case 'list':
                    const mfes = await mfeManager.listMFEs();
                    return json(200, { success: true, data: mfes });

                case 'get':
                    const mfe = await mfeManager.getMFE(query.name);
                    if (!mfe) return json(404, { error: 'MFE not found' });
                    return json(200, { success: true, data: mfe });

                case 'create':
                    if (method !== 'POST') return json(405, { error: 'POST required' });
                    const created = await mfeManager.registerMFE(
                        body.name,
                        body.source,
                        body
                    );
                    return json(201, { success: true, data: created });

                case 'update':
                    if (method !== 'POST' && method !== 'PUT') {
                        return json(405, { error: 'POST/PUT required' });
                    }
                    const updated = await mfeManager.updateMFE(body.name, body);
                    if (!updated) return json(404, { error: 'MFE not found' });
                    return json(200, { success: true, data: updated });

                case 'delete':
                    if (method !== 'DELETE' && method !== 'POST') {
                        return json(405, { error: 'DELETE required' });
                    }
                    const deleted = await mfeManager.deleteMFE(query.name || body.name);
                    return json(200, { success: deleted, message: deleted ? 'Deleted' : 'Not found' });

                case 'toggle':
                    const toggled = await mfeManager.toggleMFE(
                        body.name,
                        body.active
                    );
                    return json(200, { success: true, data: toggled });

                case 'bump':
                    const bumped = await mfeManager.bumpVersion(
                        body.name,
                        body.type || 'patch'
                    );
                    return json(200, { success: true, data: bumped });

                case 'discover':
                    const discovered = await mfeManager.discoverMFEs();
                    return json(200, { success: true, data: discovered });
            }
        }

        // Function Management
        if (resource === 'function') {
            switch (action) {
                case 'list':
                    const functions = await fissionClient.listFunctions();
                    return json(200, { success: true, data: functions });

                case 'create':
                    if (method !== 'POST') return json(405, { error: 'POST required' });

                    let createCodePath = body.codePath;
                    if (body.code) {
                        // Write provided code to temp file
                        const tmpFile = `/tmp/${body.name}-${Date.now()}.js`;
                        require('fs').writeFileSync(tmpFile, body.code);
                        createCodePath = tmpFile;
                    }

                    const fnCreated = await fissionClient.createFunction(
                        body.name,
                        body.env || 'nodejs',
                        createCodePath,
                        body.namespace
                    );
                    return json(201, { success: true, message: fnCreated });

                case 'update':
                    if (method !== 'POST' && method !== 'PUT') {
                        return json(405, { error: 'POST/PUT required' });
                    }

                    let updateCodePath = body.codePath;
                    if (body.code) {
                        // Write provided code to temp file
                        const tmpFile = `/tmp/${body.name}-${Date.now()}.js`;
                        require('fs').writeFileSync(tmpFile, body.code);
                        updateCodePath = tmpFile;
                    }

                    const fnUpdated = await fissionClient.updateFunction(
                        body.name,
                        updateCodePath,
                        body.namespace
                    );
                    return json(200, { success: true, message: fnUpdated });

                case 'get':
                    // Fetch function code (not directly supported by CLI easily, but can read if we stored it or source archive)
                    // For now, returning placeholder or implementation needed
                    return json(501, { error: 'Get function code not implemented yet' });

                case 'delete':
                    const fnDeleted = await fissionClient.deleteFunction(
                        query.name || body.name,
                        query.namespace
                    );
                    return json(200, { success: true, message: fnDeleted });

                case 'logs':
                    const logs = await fissionClient.getFunctionLogs(
                        query.name,
                        query.namespace
                    );
                    return json(200, { success: true, data: logs });

                case 'test':
                    const testResult = await fissionClient.testFunction(
                        body.name,
                        body.method || 'GET',
                        body.body,
                        body.namespace
                    );
                    return json(200, { success: true, data: testResult });
            }
        }

        // Environments
        if (resource === 'env') {
            switch (action) {
                case 'list':
                    const envs = await fissionClient.listEnvs();
                    return json(200, { success: true, data: envs });

                case 'create':
                    if (method !== 'POST') return json(405, { error: 'POST required' });
                    const envCreated = await fissionClient.createEnv(
                        body.name,
                        body.image
                    );
                    return json(201, { success: true, message: envCreated });
            }
        }

        // Routes
        if (resource === 'route') {
            switch (action) {
                case 'list':
                    const routes = await fissionClient.listRoutes();
                    return json(200, { success: true, data: routes });

                case 'create':
                    if (method !== 'POST') return json(405, { error: 'POST required' });
                    const routeCreated = await fissionClient.createRoute(
                        body.name,
                        body.method,
                        body.url,
                        body.function
                    );
                    return json(201, { success: true, message: routeCreated });
            }
        }

        // Dashboard summary
        if (resource === 'dashboard') {
            const [mfes, functions, envs, routes] = await Promise.all([
                mfeManager.listMFEs().catch(() => []),
                fissionClient.listFunctions().catch(() => []),
                fissionClient.listEnvs().catch(() => []),
                fissionClient.listRoutes().catch(() => [])
            ]);

            return json(200, {
                success: true,
                data: {
                    mfeCount: mfes.length,
                    functionCount: functions.length,
                    envCount: envs.length,
                    routeCount: routes.length,
                    mfes: mfes.slice(0, 5),
                    functions: functions.slice(0, 5)
                }
            });
        }

        return json(400, { error: 'Invalid resource or action' });

    } catch (error) {
        console.error('Master API Error:', error);
        return json(500, {
            error: 'Internal server error',
            message: error.message
        });
    }
};

function json(status, body) {
    return {
        status,
        body,
        headers: { 'Content-Type': 'application/json' }
    };
}
