/**
 * SDUI Button Component
 *
 * Renders a button with various variants and states using the theme system.
 */

import React from 'react';
import type { SDUIButtonComponent, SDUIRendererContext } from '../../sdui/types';
import { useCurrentTheme } from '../../sdui/theme/ThemeProvider';

export interface ButtonProps extends SDUIButtonComponent {
  __sdui_context__?: SDUIRendererContext;
}

export function Button({
  id,
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  action,
  className = '',
  style,
  __sdui_context__,
  testId,
}: ButtonProps): React.ReactElement {
  const theme = useCurrentTheme();
  const isLoading = loading || __sdui_context__?.loadingStates?.[id] || false;
  const isDisabled = disabled || isLoading;

  const handleClick = () => {
    if (!isDisabled && action && __sdui_context__?.onAction) {
      __sdui_context__.onAction(action, id);
    }
  };

  // Get variant styles based on theme
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDisabled
            ? theme.colors.surfaceVariant
            : isLoading
            ? theme.colors.primary
            : theme.colors.primary,
          color: theme.colors.primaryForeground,
          border: 'none',
          boxShadow: theme.shadows.md,
        };
      case 'secondary':
        return {
          backgroundColor: isDisabled
            ? theme.colors.surfaceVariant
            : theme.colors.secondary,
          color: theme.colors.secondaryForeground,
          border: 'none',
          boxShadow: theme.shadows.sm,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: isDisabled ? theme.colors.text.tertiary : theme.colors.primary,
          border: `2px solid ${isDisabled ? theme.colors.border : theme.colors.primary}`,
          boxShadow: 'none',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: isDisabled ? theme.colors.text.tertiary : theme.colors.primary,
          border: 'none',
          boxShadow: 'none',
        };
      case 'danger':
        return {
          backgroundColor: isDisabled
            ? theme.colors.surfaceVariant
            : theme.colors.error,
          color: theme.colors.errorForeground,
          border: 'none',
          boxShadow: theme.shadows.md,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          color: theme.colors.primaryForeground,
          border: 'none',
        };
    }
  };

  // Get size styles
  const getSizeStyles = (): React.CSSProperties => {
    const sizeMap = {
      sm: {
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        fontSize: theme.typography.fontSize.sm,
        borderRadius: theme.borderRadius.sm,
      },
      md: {
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        fontSize: theme.typography.fontSize.base,
        borderRadius: theme.borderRadius.md,
      },
      lg: {
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        fontSize: theme.typography.fontSize.lg,
        borderRadius: theme.borderRadius.lg,
      },
    };
    return sizeMap[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <button
      id={id}
      data-testid={testId || `button-${id}`}
      onClick={handleClick}
      disabled={isDisabled}
      className={`sdui-button ${className}`.trim()}
      style={{
        ...variantStyles,
        ...sizeStyles,
        fontWeight: theme.typography.fontWeight.semibold,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease-in-out',
        opacity: isDisabled ? 0.6 : 1,
        fontFamily: theme.typography.fontFamily.sans.join(', '),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
        }
        if (!isDisabled && variant === 'outline') {
          e.currentTarget.style.backgroundColor = theme.colors.surface;
        }
        if (!isDisabled && variant === 'ghost') {
          e.currentTarget.style.backgroundColor = theme.colors.surface;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = theme.colors.primary;
        }
        if (!isDisabled && (variant === 'outline' || variant === 'ghost')) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            style={{ width: '1rem', height: '1rem' }}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span
              className="icon-left"
              dangerouslySetInnerHTML={{ __html: icon }}
              style={{ display: 'flex', alignItems: 'center' }}
            />
          )}
          <span>{label}</span>
          {icon && iconPosition === 'right' && (
            <span
              className="icon-right"
              dangerouslySetInnerHTML={{ __html: icon }}
              style={{ display: 'flex', alignItems: 'center' }}
            />
          )}
        </>
      )}
    </button>
  );
}
