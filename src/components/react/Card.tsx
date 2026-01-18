/**
 * SDUI Card Component
 *
 * Renders a card with various visual styles using the theme system.
 */

import React from 'react';
import type { SDUICardComponent, SDUIRendererContext } from '../../sdui/types';
import { useCurrentTheme } from '../../sdui/theme/ThemeProvider';
import { SDUIRenderer } from '../../sdui/renderer';

export interface CardProps extends SDUICardComponent {
  __sdui_context__?: SDUIRendererContext;
}

export function Card({
  id,
  children,
  variant = 'default',
  padding,
  clickable = false,
  action,
  className = '',
  style,
  __sdui_context__,
  testId,
}: CardProps): React.ReactElement {
  const theme = useCurrentTheme();

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.xl,
          transform: 'translateY(0)',
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.background,
          border: `2px solid ${theme.colors.primary}`,
          boxShadow: 'none',
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: 'none',
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.colors.borderLight}`,
          boxShadow: theme.shadows.lg,
        };
      default:
        return {
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.md,
        };
    }
  };

  const handleClick = () => {
    if (clickable && action && __sdui_context__?.onAction) {
      __sdui_context__.onAction(action, id);
    }
  };

  const cardStyle: React.CSSProperties = {
    ...getVariantStyles(),
    padding: padding || theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    transition: 'all 200ms ease-in-out',
    cursor: clickable ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div
      id={id}
      data-testid={testId || `card-${id}`}
      onClick={handleClick}
      className={`sdui-card ${clickable ? 'sdui-card-clickable' : ''} ${className}`.trim()}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = theme.shadows['2xl'];
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = getVariantStyles().boxShadow;
        }
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
