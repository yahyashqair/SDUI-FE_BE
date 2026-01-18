/**
 * SDUI Hero Component
 *
 * Renders a hero section with title, subtitle, and actions using the theme system.
 */

import React from 'react';
import type { SDUIHeroComponent, SDUIRendererContext } from '../../sdui/types';
import { useCurrentTheme } from '../../sdui/theme/ThemeProvider';
import { SDUIRenderer } from '../../sdui/renderer';

export interface HeroProps extends SDUIHeroComponent {
  __sdui_context__?: SDUIRendererContext;
}

export function Hero({
  id,
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  image,
  alignment = 'center',
  size = 'lg',
  className = '',
  style,
  __sdui_context__,
  testId,
}: HeroProps): React.ReactElement {
  const theme = useCurrentTheme();

  const getSizePadding = (): string => {
    const sizeMap = {
      sm: theme.spacing.xl,
      md: theme.spacing['2xl'],
      lg: theme.spacing['3xl'],
      xl: theme.spacing['3xl'],
    };
    return sizeMap[size];
  };

  return (
    <section
      id={id}
      data-testid={testId || `hero-${id}`}
      className={`sdui-hero ${className}`.trim()}
      style={{
        background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.surfaceVariant} 100%)`,
        padding: `${getSizePadding()} ${theme.spacing.md}`,
        ...style,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: image ? 'column' : 'column',
            alignItems: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
            textAlign: alignment,
            gap: theme.spacing.xl,
          }}
        >
          <div style={{ flex: image ? '1' : 'auto', width: image ? '100%' : 'auto' }}>
            <h1
              style={{
                fontSize: theme.typography.fontSize['5xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.md,
                lineHeight: theme.typography.lineHeight.tight,
                fontFamily: theme.typography.fontFamily.sans.join(', '),
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.primary,
                  marginBottom: theme.spacing.md,
                  fontFamily: theme.typography.fontFamily.sans.join(', '),
                }}
              >
                {subtitle}
              </p>
            )}
            {description && (
              <p
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xl,
                  maxWidth: '600px',
                  lineHeight: theme.typography.lineHeight.relaxed,
                  fontFamily: theme.typography.fontFamily.sans.join(', '),
                }}
              >
                {description}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.md,
                justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              {secondaryAction && (
                <SDUIRenderer component={secondaryAction} context={__sdui_context__} />
              )}
              {primaryAction && (
                <SDUIRenderer component={primaryAction} context={__sdui_context__} />
              )}
            </div>
          </div>
          {image && (
            <div
              style={{
                flex: '1',
                marginTop: theme.spacing.xl,
              }}
            >
              <SDUIRenderer component={image} context={__sdui_context__} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
