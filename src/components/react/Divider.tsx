/**
 * SDUI Divider Component
 *
 * Renders a visual divider between sections using the theme system.
 */

import React from 'react';
import type { SDUIDividerComponent } from '../../sdui/types';
import { useCurrentTheme } from '../../sdui/theme/ThemeProvider';

export interface DividerProps extends SDUIDividerComponent {}

export function Divider({
  id,
  orientation = 'horizontal',
  thickness = '1px',
  className = '',
  style,
  testId,
}: DividerProps): React.ReactElement {
  const theme = useCurrentTheme();
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      id={id}
      data-testid={testId || `divider-${id}`}
      className={`sdui-divider ${className}`.trim()}
      style={{
        [isHorizontal ? 'width' : 'height']: isHorizontal ? '100%' : '100%',
        [isHorizontal ? 'height' : 'width']: thickness,
        backgroundColor: theme.colors.border,
        ...style,
      }}
    />
  );
}
