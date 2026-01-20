
import path from 'path';
import { build } from 'esbuild';
import { FileSystem } from '../db/fs';

/**
 * Builds a React Component (MFE) into a standalone JS bundle
 */
export const buildMFE = async (projectId: string, componentName: string) => {
    const projectDir = FileSystem.getProjectDir(projectId);
    const inputFile = path.join(projectDir, 'frontend', `${componentName}.tsx`);
    const outDir = path.join(projectDir, '..', 'dist'); // data/tenants/<id>/dist

    // Check input
    try {
        FileSystem.readFile(projectId, `frontend/${componentName}.tsx`);
    } catch (e) {
        throw new Error(`Component source not found: frontend/${componentName}.tsx`);
    }

    try {
        await build({
            entryPoints: [inputFile],
            bundle: true,
            outfile: path.join(outDir, `${componentName}.js`),
            format: 'esm', // Standard ESM for browser loading
            target: 'es2020',
            external: ['react', 'react-dom'], // Peer dependencies provided by host
            loader: { '.tsx': 'tsx', '.ts': 'ts' },
            minify: true, // "Serverless" optimized
        });
        return true;
    } catch (e: any) {
        console.error('Build failed:', e);
        throw e;
    }
};
