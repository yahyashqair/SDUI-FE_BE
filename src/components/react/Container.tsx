/**
 * SDUI Container Component
 *
 * Renders a flex container for layout purposes using the theme system.
 */

import React from 'react';
import type { SDUIContainerComponent, SDUIRendererContext } from '../../sdui/types';
import { useCurrentTheme } from '../../sdui/theme/ThemeProvider';
import { SDUIRenderer } from '../../sdui/renderer';

export interface ContainerProps extends SDUIContainerComponent {
  __sdui_context__?: SDUIRendererContext;
}

export function Container({
  id,
  children,
  direction = 'column',
  align = 'start',
  justify = 'start',
  gap,
  padding,
  margin,
  maxWidth,
  className = '',
  style,
  __sdui_context__,
  testId,
}: ContainerProps): React.ReactElement {
  const theme = useCurrentTheme();

  const getAlignItems = () => {
    const alignMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    return alignMap[align];
  };

  const getJustifyContent = () => {
    const justifyMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      'space-between': 'space-between',
      'space-around': 'space-around',
    };
    return justifyMap[justify];
  };

  return (
    <div
      id={id}
      data-testid={testId || `container-${id}`}
      className={`sdui-container ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: direction,
        alignItems: getAlignItems(),
        justifyContent: getJustifyContent(),
        gap: gap || theme.spacing.md,
        padding: padding || '0',
        margin: margin || '0',
        maxWidth: maxWidth || 'none',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children.map((child, index) => (
        <SDUIRenderer
          key={child.id || index}
          component={child}
          context={__sdui_context__}
        />
      ))}
    </div>
  );
}
