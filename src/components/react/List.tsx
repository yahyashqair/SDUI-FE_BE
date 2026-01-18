/**
 * SDUI List Component
 *
 * Renders a list with various styling options.
 */

import React from 'react';
import type { SDUIListComponent, SDUIRendererContext } from '../../sdui/types';
import { SDUIRenderer } from '../../sdui/renderer';

export interface ListProps extends SDUIListComponent {
  __sdui_context__?: SDUIRendererContext;
}

const variantStyles: Record<NonNullable<ListProps['variant']>, string> = {
  bulleted: 'list-disc list-inside',
  numbered: 'list-decimal list-inside',
  none: 'list-none',
};

const spacingStyles: Record<NonNullable<ListProps['spacing']>, string> = {
  tight: 'space-y-1',
  normal: 'space-y-2',
  relaxed: 'space-y-4',
};

export function List({
  id,
  items,
  variant = 'none',
  spacing = 'normal',
  className = '',
  style,
  __sdui_context__,
  testId,
}: ListProps): React.ReactElement {
  if (variant === 'none') {
    // Render as div container with custom spacing
    return (
      <div
        id={id}
        data-testid={testId || `list-${id}`}
        className={`${spacingStyles[spacing]} ${className}`.trim()}
        style={style}
      >
        {items.map((item, index) => (
          <SDUIRenderer
            key={item.id || index}
            component={item}
            context={__sdui_context__}
          />
        ))}
      </div>
    );
  }

  const ListTag = variant === 'numbered' ? 'ol' : 'ul';

  return (
    <ListTag
      id={id}
      data-testid={testId || `list-${id}`}
      className={`${variantStyles[variant]} ${spacingStyles[spacing]} ${className}`.trim()}
      style={style}
    >
      {items.map((item, index) => (
        <li key={item.id || index}>
          <SDUIRenderer component={item} context={__sdui_context__} />
        </li>
      ))}
    </ListTag>
  );
}
