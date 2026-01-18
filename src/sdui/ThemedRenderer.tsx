import React from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import { SDUIRenderer, type SDUIRendererProps } from './renderer';

export function ThemedRenderer(props: SDUIRendererProps) {
  return (
    <ThemeProvider>
      <SDUIRenderer {...props} />
    </ThemeProvider>
  );
}
