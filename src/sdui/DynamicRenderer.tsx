import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { SDUIRenderer } from './renderer';
import { SDUIViewSchema } from './schemas';
import type { SDUIView, SDUIAction } from './types';

interface DynamicSDUIProps {
    endpoint: string;
}

// Global Store Context
interface StoreContextType {
    state: Record<string, any>;
    setValue: (path: string, value: any) => void;
    getValue: (path: string) => any;
    executeAction: (action: SDUIAction) => void;
}

export const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used within DynamicSDUIRenderer");
    return ctx;
};

export function DynamicSDUIRenderer({ endpoint }: DynamicSDUIProps) {
    const [view, setView] = useState<SDUIView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [store, setStore] = useState<Record<string, any>>({});

    const setValue = useCallback((path: string, value: any) => {
        setStore(prev => {
            const next = structuredClone(prev);
            const keys = path.split('.');
            let current = next;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return next;
        });
    }, []);

    const getValue = useCallback((path: string) => {
        return path.split('.').reduce((o, k) => (o || {})[k], store);
    }, [store]);

    // Simple action handler (replaces WorkflowEngine)
    const executeAction = useCallback((action: SDUIAction) => {
        if (action.type === 'navigation' && typeof action.payload === 'string') {
            window.location.href = action.payload;
        }
        // Add more action types as needed
    }, []);

    useEffect(() => {
        let mounted = true;

        async function fetchView() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(endpoint);

                if (!response.ok) {
                    if (response.status === 404) throw new Error('View not found');
                    throw new Error(`Failed to fetch view: ${response.statusText}`);
                }

                const data = await response.json();
                const result = SDUIViewSchema.safeParse(data);

                if (!result.success) {
                    console.error('Validation Errors:', result.error);
                    throw new Error('Server response did not match expected SDUI schema');
                }

                if (mounted) {
                    const parsedView = result.data as SDUIView;
                    setView(parsedView);
                    if (parsedView.variables) {
                        setStore(prev => ({ ...prev, ...parsedView.variables }));
                    }
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchView();

        return () => {
            mounted = false;
        };
    }, [endpoint]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <h3 className="font-bold mb-2">Error Loading UI</h3>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!view) {
        return null;
    }

    return (
        <StoreContext.Provider value={{ state: store, setValue, getValue, executeAction }}>
            <div className="dynamic-sdui-root">
                <SDUIRenderer component={view.root} />
            </div>
        </StoreContext.Provider>
    );
}
