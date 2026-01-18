/**
 * SDUI Badge Component
 *
 * Renders a badge/tag with color variants using the theme system.
 */

import React from 'react';
import type { SDUIBadgeComponent } from '../../sdui/types';
import { useCurrentTheme } from '../../sdui/theme/ThemeProvider';

export interface BadgeProps extends SDUIBadgeComponent {}

export function Badge({
  id,
  label,
  variant = 'default',
  size = 'md',
  className = '',
  style,
  testId,
}: BadgeProps): React.ReactElement {
  const theme = useCurrentTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          color: theme.colors.successForeground,
          border: 'none',
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          color: theme.colors.warningForeground,
          border: 'none',
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          color: theme.colors.errorForeground,
          border: 'none',
        };
      case 'info':
        return {
          backgroundColor: theme.colors.info,
          color: theme.colors.infoForeground,
          border: 'none',
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text.primary,
          border: `1px solid ${theme.colors.border}`,
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    const sizeMap = {
      sm: {
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        fontSize: theme.typography.fontSize.xs,
        borderRadius: theme.borderRadius.full,
      },
      md: {
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        fontSize: theme.typography.fontSize.sm,
        borderRadius: theme.borderRadius.full,
      },
    };
    return sizeMap[size];
  };

  return (
    <span
      id={id}
      data-testid={testId || `badge-${id}`}
      className={`sdui-badge ${className}`.trim()}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: theme.typography.fontWeight.medium,
        fontFamily: theme.typography.fontFamily.sans.join(', '),
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
