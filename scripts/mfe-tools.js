
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

const MFE_DIR = join(process.cwd(), 'public', 'mfe');
const REGISTRY_PATH = join(MFE_DIR, 'mfe-registry.json');
const BASE_URL = '/mfe';

async function generateIntegrity(filePath) {
    const content = await readFile(filePath);
    const hash = createHash('sha384').update(content).digest('base64');
    return `sha384-${hash}`;
}

async function scanMFEs() {
    console.log(`Scanning ${MFE_DIR}...`);
    const entries = await readdir(MFE_DIR, { withFileTypes: true });
    const mfes = {};

    let currentRegistry = { mfes: {} };
    try {
        const content = await readFile(REGISTRY_PATH, 'utf-8');
        currentRegistry = JSON.parse(content);
    } catch (e) {
        console.log('No existing registry found, creating new.');
    }

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const mfeName = entry.name;
            const entryFile = 'index.js';
            const fullPath = join(MFE_DIR, mfeName, entryFile);

            try {
                // Check if index.js exists
                await stat(fullPath);

                // Generate Integrity Hash
                const integrity = await generateIntegrity(fullPath);

                // Keep existing metadata if available, update technical details
                const existing = currentRegistry.mfes[mfeName] || {};

                mfes[mfeName] = {
                    ...existing,
                    source: `${BASE_URL}/${mfeName}/${entryFile}`,
                    integrity: integrity,
                    version: existing.version || '1.0.0',
                    variables: existing.variables || { title: mfeName },
                    description: existing.description || `Micro-Frontend ${mfeName}`
                };

                console.log(`✅ Found ${mfeName} (Integrity: ${integrity.substring(0, 15)}...)`);

            } catch (e) {
                // Skip if index.js doesn't exist
            }
        }
    }

    const newRegistry = {
        ...currentRegistry,
        mfes,
        generatedAt: new Date().toISOString()
    };

    await writeFile(REGISTRY_PATH, JSON.stringify(newRegistry, null, 4));
    console.log(`\nRegistry updated at ${REGISTRY_PATH}`);
}

scanMFEs().catch(console.error);
