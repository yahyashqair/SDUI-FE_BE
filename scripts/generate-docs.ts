import { Application } from 'typedoc';
import path from 'path';

async function generateDocs() {
    const app = await Application.bootstrapWithPlugins({
        entryPoints: [
            'src/platform/executor.ts',
            'src/dashboard/lib/mfe-manager.ts',
            'src/dashboard/lib/fission-client.ts',
            'src/db/fs.ts'
        ],
        out: 'docs/api',
        plugin: ['typedoc-plugin-markdown'],
        readme: 'none',
        name: 'Project API Documentation',
        skipErrorChecking: true
    });

    const project = await app.convert();

    if (project) {
        await app.generateDocs(project, 'docs/api');
        console.log('Documentation generated in docs/api');
    } else {
        console.error('Failed to generate documentation');
    }
}

generateDocs().catch(console.error);
