/**
 * SDUI Spacer Component
 *
 * Renders empty space for layout purposes.
 */

import React from 'react';
import type { SDUISpacerComponent } from '../../sdui/types';

export interface SpacerProps extends SDUISpacerComponent {}

export function Spacer({
  id,
  size = '1rem',
  className = '',
  style,
  testId,
}: SpacerProps): React.ReactElement {
  return (
    <div
      id={id}
      data-testid={testId || `spacer-${id}`}
      className={className}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
