
import type { APIRoute } from 'astro';
import mfeManager from '../../dashboard/lib/mfe-manager';
import fissionClient from '../../dashboard/lib/fission-client';
import fs from 'fs';
import path from 'path';

export const ALL: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const method = request.method;

    let body = {};
    if (method !== 'GET' && method !== 'HEAD') {
        try {
            body = await request.json();
        } catch (e) {
            // ignore if no body
        }
    }

    const action = params.action || 'list';
    const resource = params.resource || 'mfe';

    // Helper for JSON response
    const json = (status: number, data: any) => new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    try {
        // 4. Releases Management
        if (resource === 'releases') {
            const releaseFile = path.join(process.cwd(), 'data/releases.json');
            const ENVIRONMENTS = ['dev', 'staging', 'prod'];

            // Ensure file exists
            if (!fs.existsSync(releaseFile)) {
                fs.writeFileSync(releaseFile, JSON.stringify([]));
            }

            if (action === 'envs') {
                return json(200, { environments: ENVIRONMENTS });
            }

            if (action === 'promote') {
                if (method !== 'POST') return json(405, { error: 'POST required' });
                const { releaseId, env } = body as any;

                if (!ENVIRONMENTS.includes(env)) {
                    return json(400, { error: 'Invalid environment' });
                }

                let releases = JSON.parse(fs.readFileSync(releaseFile, 'utf-8'));
                const releaseIndex = releases.findIndex((r: any) => r.id === releaseId);

                if (releaseIndex === -1) {
                    return json(404, { error: 'Release not found' });
                }

                // Initialize deployments if missing
                if (!releases[releaseIndex].deployments) {
                    releases[releaseIndex].deployments = [];
                }

                // Add deployment record
                releases[releaseIndex].deployments.push({
                    env,
                    deployedAt: new Date().toISOString(),
                    deployedBy: 'admin' // TODO: auth info
                });

                // Update status if promoting to prod
                if (env === 'prod') {
                    releases[releaseIndex].status = 'active';
                    // Deactivate others? Maybe later.
                }

                fs.writeFileSync(releaseFile, JSON.stringify(releases, null, 2));
                return json(200, { success: true, release: releases[releaseIndex] });
            }

            if (action === 'rollback') {
                // Rollback is essentially promoting an older version to an environment
                // Re-use logic or just call it 'promote' in UI, but good to have explicit API
                // For now, let's just alias to promote logic
                return json(400, { error: 'Use promote action to deploy an older version' });
            }

            if (method === 'GET') {
                const releases = JSON.parse(fs.readFileSync(releaseFile, 'utf-8'));
                // Sort by created_at desc
                releases.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                return new Response(JSON.stringify({ releases }), { status: 200 });
            }

            if (method === 'POST') {
                const { version, description, status } = body as any;

                // For artifacts, we snapshot the CURRENT MFE registry
                const mfeRegistry = mfeManager.loadRegistry();
                const artifacts = {
                    mfes: Object.values(mfeRegistry).map((m: any) => ({
                        name: m.name, // The registry structure might be different, let's check mfeManager
                        version: m.version,
                        source: m.source
                    }))
                };

                const newRelease = {
                    id: crypto.randomUUID(),
                    version,
                    description,
                    artifacts,
                    status: status || 'draft',
                    created_at: new Date().toISOString()
                };

                const releases = JSON.parse(fs.readFileSync(releaseFile, 'utf-8'));
                releases.push(newRelease);
                fs.writeFileSync(releaseFile, JSON.stringify(releases, null, 2));

                return new Response(JSON.stringify({ release: newRelease }), { status: 201 });
            }
        }

        // MFE Management
        if (resource === 'mfe') {
            switch (action) {
                case 'list':
                    const mfes = await mfeManager.listMFEs();
                    return json(200, { success: true, data: mfes });

                case 'get':
                    const mfe = await mfeManager.getMFE(params.name);
                    if (!mfe) return json(404, { error: 'MFE not found' });
                    return json(200, { success: true, data: mfe });

                case 'create':
                    if (method !== 'POST') return json(405, { error: 'POST required' });
                    const created = await mfeManager.registerMFE(
                        (body as any).name,
                        (body as any).source,
                        body
                    );
                    return json(201, { success: true, data: created });

                case 'update':
                    if (method !== 'POST' && method !== 'PUT') {
                        return json(405, { error: 'POST/PUT required' });
                    }
                    const updated = await mfeManager.updateMFE((body as any).name, body);
                    if (!updated) return json(404, { error: 'MFE not found' });
                    return json(200, { success: true, data: updated });

                case 'delete':
                    if (method !== 'DELETE' && method !== 'POST') {
                        return json(405, { error: 'DELETE required' });
                    }
                    const deleted = await mfeManager.deleteMFE(params.name || (body as any).name);
                    return json(200, { success: deleted, message: deleted ? 'Deleted' : 'Not found' });

                case 'toggle':
                    const toggled = await mfeManager.toggleMFE(
                        (body as any).name,
                        (body as any).active
                    );
                    return json(200, { success: true, data: toggled });

                case 'bump':
                    const bumped = await mfeManager.bumpVersion(
                        (body as any).name,
                        (body as any).type || 'patch'
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

                    let createCodePath = (body as any).codePath;
                    if ((body as any).code) {
                        const tmpFile = `/tmp/${(body as any).name}-${Date.now()}.js`;
                        require('fs').writeFileSync(tmpFile, (body as any).code);
                        createCodePath = tmpFile;
                    }

                    const fnCreated = await fissionClient.createFunction(
                        (body as any).name,
                        (body as any).env || 'nodejs',
                        createCodePath,
                        (body as any).namespace
                    );
                    return json(201, { success: true, message: fnCreated });

                case 'update':
                    if (method !== 'POST' && method !== 'PUT') {
                        return json(405, { error: 'POST/PUT required' });
                    }

                    let updateCodePath = (body as any).codePath;
                    if ((body as any).code) {
                        const tmpFile = `/tmp/${(body as any).name}-${Date.now()}.js`;
                        require('fs').writeFileSync(tmpFile, (body as any).code);
                        updateCodePath = tmpFile;
                    }

                    const fnUpdated = await fissionClient.updateFunction(
                        (body as any).name,
                        updateCodePath,
                        (body as any).namespace
                    );
                    return json(200, { success: true, message: fnUpdated });

                case 'delete':
                    const fnDeleted = await fissionClient.deleteFunction(
                        params.name || (body as any).name,
                        params.namespace
                    );
                    return json(200, { success: true, message: fnDeleted });

                case 'logs':
                    const logs = await fissionClient.getFunctionLogs(
                        params.name,
                        params.namespace
                    );
                    return json(200, { success: true, data: logs });

                case 'test':
                    const testResult = await fissionClient.testFunction(
                        (body as any).name,
                        (body as any).method || 'GET',
                        (body as any).body,
                        (body as any).namespace
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
                        (body as any).name,
                        (body as any).image
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
                        (body as any).name,
                        (body as any).method,
                        (body as any).url,
                        (body as any).function
                    );
                    return json(201, { success: true, message: routeCreated });

                case 'delete':
                    if (method !== 'DELETE' && method !== 'POST') {
                        return json(405, { error: 'DELETE required' });
                    }
                    // Implement delete route in fission-client first if missing, 
                    // assuming CLI is `fission route delete --name {name}`
                    const { stdout } = await require('util').promisify(require('child_process').exec)(
                        `fission route delete --name ${params.name || (body as any).name}`
                    );
                    return json(200, { success: true, message: stdout.trim() });
            }
        }

        return json(400, { error: 'Invalid resource or action' });

    } catch (error: any) {
        console.error('Master API Error:', error);
        return json(500, {
            error: 'Internal server error',
            message: error.message
        });
    }
}
