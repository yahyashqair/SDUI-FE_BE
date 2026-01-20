import React, { useEffect, useRef, useState } from 'react';
import { MFERuntime, type MFERuntimeContext, type MFEModule } from './MFERuntime';
import { errorReporter } from './ErrorReporter';
import { globalEventBus } from './EventBus';
import { dependencies } from './dependencies';

/**
 * MFE Spec returned from the Route Registry
 */
export interface MFESpec {
    name: string;
    source: string;
    integrity?: string;
    variables?: Record<string, any>;
    version?: string;
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
 * RemoteRenderer - The core component that loads and renders MFEs
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
                const module = await MFERuntime.load(mfeSpec.source, mfeSpec.integrity);

                if (!mounted) return;

                const context: Omit<MFERuntimeContext, 'container'> = {
                    deps: dependencies,
                    eventBus: globalEventBus.scoped(mfeSpec.name),
                    config: mfeSpec.variables || {}
                };

                // Clear previous content
                containerRef.current.innerHTML = '';

                cleanup = MFERuntime.mount(module, containerRef.current, context);

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
    }, [mfeSpec]);

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
             <div ref={containerRef} className="mfe-container" />
        </ErrorBoundary>
    );
}
