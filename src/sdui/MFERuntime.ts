/**
 * MFE Runtime & Loader
 * Handles loading, mounting, and lifecycle management of Micro-Frontends.
 */
import { dependencies, type SharedDeps } from './dependencies';
import { type EventBus } from './EventBus';

export interface MFEConfig {
    source: string;
    variables?: Record<string, any>;
}

export interface MFERuntimeContext {
    deps: SharedDeps;
    eventBus: EventBus;
    config: Record<string, any>;
    container: HTMLElement;
}

export type MountFn = (
    container: HTMLElement,
    context: Omit<MFERuntimeContext, 'container'>
) => (() => void) | void;

export interface MFEModule {
    mount: MountFn;
    default?: unknown; // Legacy support check
}

export class MFERuntime {
    private static cache: Record<string, MFEModule> = {};

    static async load(source: string, integrity?: string): Promise<MFEModule> {
        if (this.cache[source]) {
            return this.cache[source];
        }

        try {
            // Bypass Vite's static analysis by fetching as text and creating a Blob URL
            const fetchOptions: RequestInit = {};
            if (integrity) {
                fetchOptions.integrity = integrity;
            }

            const res = await fetch(source, fetchOptions);
            if (!res.ok) {
                throw new Error(`Failed to fetch MFE at ${source}: ${res.statusText}`);
            }
            const text = await res.text();

            // Create a Blob from the module content
            const blob = new Blob([text], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);

            // Import the Blob URL
            // @vite-ignore
            const module = await import(/* @vite-ignore */ blobUrl);

            // We can revoke the object URL after import, as the module is loaded
            URL.revokeObjectURL(blobUrl);

            if (!module.mount) {
                throw new Error(`MFE at ${source} does not export a 'mount' function.`);
            }

            this.cache[source] = module;
            return module;
        } catch (error) {
            console.error(`[MFERuntime] Failed to load MFE: ${source}`, error);
            throw error;
        }
    }

    static mount(
        module: MFEModule,
        container: HTMLElement,
        context: Omit<MFERuntimeContext, 'container'>
    ) {
        try {
            const cleanup = module.mount(container, context);
            return cleanup;
        } catch (error) {
            console.error('[MFERuntime] Error mounting MFE:', error);
            throw error;
        }
    }
}
