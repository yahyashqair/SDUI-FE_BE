import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { MFERuntime, type MFEModule, type MFERuntimeContext } from './MFERuntime';
import { globalEventBus } from './EventBus';
import { dependencies } from './dependencies';
import { errorReporter } from './ErrorReporter';

/**
 * MFE Spec returned from the Route Registry
 */
export interface MFESpec {
    name: string; // The unique identifier for this MFE
    source: string;
    integrity?: string;
    variables?: Record<string, any>;
    version?: string;
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

/**
 * Error Boundary for catching MFE errors
 */
class ErrorBoundary extends React.Component<
    { children: React.ReactNode; mfeName?: string; fallback?: React.ReactNode },
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
        errorReporter.report(error, {
            mfeName: this.props.mfeName,
            action: 'render',
            extra: { componentStack: info.componentStack }
        });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <h3 className="font-bold mb-2">Component Error {this.props.mfeName ? `(${this.props.mfeName})` : ''}</h3>
                    <p className="text-sm font-mono">{this.state.error?.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

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
 * Uses MFERuntime to load and mount the MFE into a container.
 */
export function RemoteRenderer({ mfeSpec }: { mfeSpec: MFESpec }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cleanup: (() => void) | void;
        let mounted = true;

        const loadAndMount = async () => {
            if (!containerRef.current) return;

            setLoading(true);
            setError(null);

            try {
                // Load the MFE module
                const module = await MFERuntime.load(mfeSpec.source, mfeSpec.integrity);

                if (!mounted) return;

                // Prepare context
                const context: Omit<MFERuntimeContext, 'container'> = {
                    deps: dependencies,
                    eventBus: globalEventBus.scoped(mfeSpec.name),
                    config: mfeSpec.variables || {}
                };

                // Mount the MFE
                // We use a Shadow DOM for isolation
                if (!containerRef.current.shadowRoot) {
                    containerRef.current.attachShadow({ mode: 'open' });
                }
                const shadowRoot = containerRef.current.shadowRoot!;

                // Clear previous content
                shadowRoot.innerHTML = '';

                // Inject Styles from Host
                // Optimized to only clone relevant styles (Tailwind, utilities)
                Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(styleNode => {
                    const isTailwind = styleNode.textContent?.includes('--tw-') ||
                        (styleNode instanceof HTMLLinkElement && styleNode.href.includes('tailwind'));
                    const isShared = styleNode.hasAttribute('data-mfe-shared');

                    if (isTailwind || isShared) {
                        shadowRoot.appendChild(styleNode.cloneNode(true));
                    }
                });

                // Create a mount point inside Shadow DOM
                const mountPoint = document.createElement('div');
                mountPoint.id = 'mfe-root';
                mountPoint.style.height = '100%';
                shadowRoot.appendChild(mountPoint);

                cleanup = MFERuntime.mount(module, mountPoint, context);

            } catch (err: any) {
                if (mounted) {
                    errorReporter.report(err, { mfeName: mfeSpec.name, action: 'mount' });
                    setError(err);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadAndMount();

        return () => {
            mounted = false;
            if (cleanup && typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, [mfeSpec]); // Re-mount if spec changes

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <h3 className="font-bold mb-2">Failed to load Micro-Frontend ({mfeSpec.name})</h3>
                <p className="text-sm font-mono">{error.message}</p>
                <p className="text-xs mt-2 text-red-500">Source: {mfeSpec.source}</p>
            </div>
        );
    }

    return (
        <ErrorBoundary mfeName={mfeSpec.name}>
            <div className="mfe-container relative min-h-[200px]">
                {loading && <PageSkeleton />}
                <div ref={containerRef} className={loading ? 'hidden' : 'block'} />
            </div>
        </ErrorBoundary>
    );
}

/**
 * Hook to fetch route and render the appropriate MFE
 */
export function useDynamicRoute(path: string) {
    const [mfeSpec, setMfeSpec] = useState<MFESpec | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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

