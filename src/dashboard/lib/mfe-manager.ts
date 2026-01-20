/**
 * MFE Manager - Manages Micro-Frontend lifecycle
 * Handles registration, bundling, deployment, and versioning
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface MFEConfig {
    name: string;
    source: string;
    integrity?: string;
    version: string;
    variables: Record<string, any>;
    dependencies?: Record<string, string>;
    encapsulation?: 'shadow' | 'none';
    description?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MFERegistry {
    mfes: Record<string, Omit<MFEConfig, 'name'>>;
    generatedAt: string;
}

const REGISTRY_PATH = process.env.MFE_REGISTRY_PATH || 'public/mfe/mfe-registry.json';
const MFE_DIR = process.env.MFE_DIR || 'public/mfe';

/**
 * Calculate SRI hash for a file
 */
export async function calculateIntegrity(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    const hash = crypto.createHash('sha384').update(content).digest('base64');
    return `sha384-${hash}`;
}

/**
 * Load current MFE registry
 */
export async function loadRegistry(): Promise<MFERegistry> {
    try {
        const content = await fs.readFile(REGISTRY_PATH, 'utf-8');
        return JSON.parse(content);
    } catch {
        return { mfes: {}, generatedAt: new Date().toISOString() };
    }
}

/**
 * Save MFE registry
 */
export async function saveRegistry(registry: MFERegistry): Promise<void> {
    registry.generatedAt = new Date().toISOString();
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 4));
}

/**
 * List all MFEs
 */
export async function listMFEs(): Promise<MFEConfig[]> {
    const registry = await loadRegistry();
    return Object.entries(registry.mfes).map(([name, config]) => ({
        name,
        ...config,
        active: config.active !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    })) as MFEConfig[];
}

/**
 * Get single MFE by name
 */
export async function getMFE(name: string): Promise<MFEConfig | null> {
    const registry = await loadRegistry();
    const config = registry.mfes[name];
    if (!config) return null;
    return {
        name,
        ...config,
        active: config.active !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    } as MFEConfig;
}

/**
 * Register a new MFE
 */
export async function registerMFE(
    name: string,
    source: string,
    options: Partial<MFEConfig> = {}
): Promise<MFEConfig> {
    const registry = await loadRegistry();

    // Check if source file exists and calculate integrity
    const sourcePath = path.join(process.cwd(), source);
    let integrity: string | undefined;
    try {
        integrity = await calculateIntegrity(sourcePath);
    } catch {
        // Source file may not exist yet for external URLs
    }

    const config: Omit<MFEConfig, 'name'> = {
        source,
        integrity,
        version: options.version || '1.0.0',
        variables: options.variables || {},
        dependencies: options.dependencies || {},
        encapsulation: options.encapsulation || 'none',
        description: options.description,
        active: options.active !== false,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    registry.mfes[name] = config;
    await saveRegistry(registry);

    return { name, ...config };
}

/**
 * Update MFE configuration
 */
export async function updateMFE(
    name: string,
    updates: Partial<MFEConfig>
): Promise<MFEConfig | null> {
    const registry = await loadRegistry();
    const existing = registry.mfes[name];

    if (!existing) return null;

    // Recalculate integrity if source changed
    if (updates.source && updates.source !== existing.source) {
        try {
            const sourcePath = path.join(process.cwd(), updates.source);
            updates.integrity = await calculateIntegrity(sourcePath);
        } catch {
            // Ignore if file doesn't exist
        }
    }

    registry.mfes[name] = {
        ...existing,
        ...updates,
        updatedAt: new Date()
    } as any;

    await saveRegistry(registry);

    return { name, ...registry.mfes[name] } as MFEConfig;
}

/**
 * Delete an MFE
 */
export async function deleteMFE(name: string): Promise<boolean> {
    const registry = await loadRegistry();

    if (!registry.mfes[name]) return false;

    delete registry.mfes[name];
    await saveRegistry(registry);

    return true;
}

/**
 * Toggle MFE active status
 */
export async function toggleMFE(name: string, active: boolean): Promise<MFEConfig | null> {
    return updateMFE(name, { active });
}

/**
 * Bump MFE version
 */
export async function bumpVersion(
    name: string,
    type: 'major' | 'minor' | 'patch' = 'patch'
): Promise<MFEConfig | null> {
    const mfe = await getMFE(name);
    if (!mfe) return null;

    const [major, minor, patch] = mfe.version.split('.').map(Number);

    let newVersion: string;
    switch (type) {
        case 'major':
            newVersion = `${major + 1}.0.0`;
            break;
        case 'minor':
            newVersion = `${major}.${minor + 1}.0`;
            break;
        case 'patch':
        default:
            newVersion = `${major}.${minor}.${patch + 1}`;
    }

    return updateMFE(name, { version: newVersion });
}

/**
 * Get MFE directories from filesystem
 */
export async function discoverMFEs(): Promise<string[]> {
    try {
        const entries = await fs.readdir(MFE_DIR, { withFileTypes: true });
        return entries
            .filter(e => e.isDirectory())
            .map(e => e.name);
    } catch {
        return [];
    }
}

export default {
    listMFEs,
    getMFE,
    registerMFE,
    updateMFE,
    deleteMFE,
    toggleMFE,
    bumpVersion,
    discoverMFEs,
    loadRegistry,
    saveRegistry,
    calculateIntegrity
};
