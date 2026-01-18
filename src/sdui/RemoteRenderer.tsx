import React, { Suspense, lazy, useMemo, useState, createContext, useContext } from 'react';

// Expose React globally for remote MFEs
if (typeof window !== 'undefined') {
    (window as any).React = React;
}

/**
 * MFE Spec returned from the Route Registry
 */
export interface MFESpec {
    source: string;
    integrity?: string;
    variables?: Record<string, any>;
}

/**
 * Context provided to every MFE
 */
export interface MFEContext {
    variables: Record<string, any>;
    globalState: Record<string, any>;
    setGlobalState: (key: string, value: any) => void;
    navigate: (path: string) => void;
    callAPI: (url: string, opts?: RequestInit) => Promise<any>;
}

const MFEContextReact = createContext<MFEContext | null>(null);

export const useMFEContext = () => {
    const ctx = useContext(MFEContextReact);
    if (!ctx) throw new Error('useMFEContext must be used within RemoteRenderer');
    return ctx;
};

/**
 * Error Boundary for catching MFE errors
 */
class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[MFE Error]', error, info);
        // TODO: Send to error tracking service
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <h3 className="font-bold mb-2">Component Error</h3>
                    <p className="text-sm font-mono">{this.state.error?.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * Dynamic loader for remote ES modules
 */
const loadRemoteMFE = (url: string) => {
    return lazy(() => import(/* @vite-ignore */ url));
};

/**
 * Skeleton loader while MFE is loading
 */
function PageSkeleton() {
    return (
        <div className="animate-pulse p-8 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}

/**
 * RemoteRenderer - The core component that loads and renders MFEs
 */
export function RemoteRenderer({ mfeSpec }: { mfeSpec: MFESpec }) {
    const [globalState, setGlobalStateRaw] = useState<Record<string, any>>({});

    // Memoize the lazy component to prevent re-loading
    const Component = useMemo(() => loadRemoteMFE(mfeSpec.source), [mfeSpec.source]);

    // Wrapper for setting state with key-path support
    const setGlobalState = (key: string, value: any) => {
        setGlobalStateRaw(prev => ({ ...prev, [key]: value }));
    };

    // Build the context object
    const context: MFEContext = {
        variables: mfeSpec.variables || {},
        globalState,
        setGlobalState,
        navigate: (path: string) => {
            window.location.href = path;
        },
        callAPI: async (url: string, opts?: RequestInit) => {
            const res = await fetch(url, opts);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            return res.json();
        }
    };

    return (
        <MFEContextReact.Provider value={context}>
            <ErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                    <Component context={context} />
                </Suspense>
            </ErrorBoundary>
        </MFEContextReact.Provider>
    );
}

/**
 * Hook to fetch route and render the appropriate MFE
 */
export function useDynamicRoute(path: string) {
    const [mfeSpec, setMfeSpec] = useState<MFESpec | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        setLoading(true);
        fetch(`/api/routes?path=${encodeURIComponent(path)}`)
            .then(res => {
                if (!res.ok) throw new Error('Route not found');
                return res.json();
            })
            .then(data => {
                setMfeSpec(data.mfe);
                setError(null);
            })
            .catch(err => {
                setError(err.message);
                setMfeSpec(null);
            })
            .finally(() => setLoading(false));
    }, [path]);

    return { mfeSpec, loading, error };
}
