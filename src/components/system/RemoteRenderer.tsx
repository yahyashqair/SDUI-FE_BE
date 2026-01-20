import React, { useEffect, useState, type ComponentType } from 'react';

interface RemoteRendererProps {
    mfeSpec: {
        url: string;
        name: string;
        props?: Record<string, any>;
    };
}

export const RemoteRenderer: React.FC<RemoteRendererProps> = ({ mfeSpec }) => {
    const [Component, setComponent] = useState<ComponentType<any> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mfeSpec?.url) return;

        const loadComponent = async () => {
            try {
                // Dynamically import the module from the URL
                // Note: The URL must be accessible and return an ESM module
                const module = await import(/* @vite-ignore */ mfeSpec.url);

                // Expecting default export or a named export matching the name
                if (module.default) {
                    setComponent(() => module.default);
                } else if (module[mfeSpec.name]) {
                    setComponent(() => module[mfeSpec.name]);
                } else {
                    throw new Error(`Component ${mfeSpec.name} not found in module ${mfeSpec.url}`);
                }
            } catch (err: any) {
                console.error(`Failed to load MFE ${mfeSpec.name}:`, err);
                setError(err.message || 'Failed to load component');
            }
        };

        loadComponent();
    }, [mfeSpec.url, mfeSpec.name]);

    if (error) {
        return <div className="p-4 bg-red-50 text-red-500 border border-red-200 rounded">Error: {error}</div>;
    }

    if (!Component) {
        return <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>;
    }

    return <Component {...(mfeSpec.props || {})} />;
};
