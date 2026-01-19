import type { APIRoute } from 'astro';
import { readFile, access, constants } from 'fs/promises';
import { join } from 'path';

export const GET: APIRoute = async ({ url }) => {
    const registryPath = join(process.cwd(), 'public', 'mfe', 'mfe-registry.json');

    try {
        const fileContent = await readFile(registryPath, 'utf-8');
        const registry = JSON.parse(fileContent);

        const targetMfe = url.searchParams.get('mfe');
        const report: Record<string, any> = {};
        let allHealthy = true;

        const mfesToCheck = targetMfe ?
            (registry.mfes[targetMfe] ? { [targetMfe]: registry.mfes[targetMfe] } : {}) :
            registry.mfes;

        if (targetMfe && !registry.mfes[targetMfe]) {
            return new Response(JSON.stringify({
                status: 'error',
                message: `MFE "${targetMfe}" not found in registry`
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        for (const [key, mfe] of Object.entries(mfesToCheck) as [string, any][]) {
            // Check if source file exists
            const sourcePath = join(process.cwd(), 'public', mfe.source);
            try {
                await access(sourcePath, constants.R_OK);
                report[key] = { status: 'healthy', version: mfe.version };
            } catch (e) {
                allHealthy = false;
                report[key] = { status: 'missing', source: mfe.source };
            }
        }

        return new Response(JSON.stringify({
            status: allHealthy ? 'ok' : 'degraded',
            mfes: report,
            timestamp: new Date().toISOString()
        }), {
            status: allHealthy ? 200 : 503,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to read registry'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
