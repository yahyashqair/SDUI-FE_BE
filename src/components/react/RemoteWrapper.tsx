// sdui/components/RemoteWrapper.tsx
import React from 'react';
import { RemoteRenderer } from '../../sdui/RemoteRenderer';

export const RemoteWrapper = ({ mfe, ...props }: any) => {
    if (!mfe) return <div className="p-4 bg-red-100 text-red-800">Missing 'mfe' spec for RemoteWrapper</div>;

    // Merge props into the mfe spec as variables or pass them?
    // The RemoteRenderer expects `mfeSpec`.
    // We can augment it.

    const augmentedSpec = {
        ...mfe,
        variables: { ...mfe.variables, ...props }
    };

    return <RemoteRenderer mfeSpec={augmentedSpec} />;
};
