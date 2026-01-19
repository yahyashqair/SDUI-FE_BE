/**
 * Shared Dependencies for MFEs
 * These are injected into the MFE runtime so MFEs don't need to bundle them.
 */
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';

// Shim for legacy ReactDOM to support MFEs written in React 17 style
// while running on React 18+ host
const ReactDOMShim = {
    ...ReactDOMClient,
    render: (element: React.ReactNode, container: HTMLElement) => {
        const root = ReactDOMClient.createRoot(container);
        root.render(element);
        // Store root on container for unmounting
        (container as any)._reactRoot = root;
        return root;
    },
    unmountComponentAtNode: (container: HTMLElement) => {
        const root = (container as any)._reactRoot;
        if (root) {
            root.unmount();
            delete (container as any)._reactRoot;
            return true;
        }
        return false;
    }
};

export interface SharedDeps {
    React: typeof React;
    ReactDOM: any; // Typed as any to support the shim interface
}

export const dependencies: SharedDeps = {
    React,
    ReactDOM: ReactDOMShim
};

export type DependencyMap = typeof dependencies;
