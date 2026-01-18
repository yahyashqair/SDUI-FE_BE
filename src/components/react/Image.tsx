/**
 * SDUI Image Component
 *
 * Renders an image with various fit options.
 */

import React from 'react';
import type { SDUIImageComponent } from '../../sdui/types';

export interface ImageProps extends SDUIImageComponent {}

const fitStyles: Record<NonNullable<ImageProps['fit']>, string> = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};

export function Image({
  id,
  src,
  alt,
  width = 'auto',
  height = 'auto',
  fit = 'cover',
  loading = 'lazy',
  className = '',
  style,
  testId,
}: ImageProps): React.ReactElement {
  return (
    <img
      id={id}
      src={src}
      alt={alt}
      data-testid={testId || `image-${id}`}
      loading={loading}
      className={`${fitStyles[fit]} ${className}`.trim()}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
}
