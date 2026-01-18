/**
 * SDUI Text Component
 *
 * Renders text content with various typography styles using the theme system.
 */

import React from 'react';
import type { SDUITextComponent } from '../../sdui/types';
import { useCurrentTheme } from '../../sdui/theme/ThemeProvider';

export interface TextProps extends SDUITextComponent {}

export function Text({
  id,
  content,
  variant = 'p',
  color,
  size = 'md',
  weight = 'normal',
  align = 'left',
  className = '',
  style,
  testId,
}: TextProps): React.ReactElement {
  const theme = useCurrentTheme();

  const getTag = () => {
    const tagMap: Record<NonNullable<TextProps['variant']>, keyof JSX.IntrinsicElements> = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      p: 'p',
      span: 'span',
      label: 'label',
    };
    return tagMap[variant];
  };

  const getFontSize = () => {
    const sizeMap = {
      xs: theme.typography.fontSize.xs,
      sm: theme.typography.fontSize.sm,
      md: theme.typography.fontSize.base,
      lg: theme.typography.fontSize.lg,
      xl: theme.typography.fontSize.xl,
      '2xl': theme.typography.fontSize['2xl'],
      '3xl': theme.typography.fontSize['3xl'],
    };
    return sizeMap[size];
  };

  const getFontWeight = () => {
    const weightMap = {
      normal: theme.typography.fontWeight.normal,
      medium: theme.typography.fontWeight.medium,
      semibold: theme.typography.fontWeight.semibold,
      bold: theme.typography.fontWeight.bold,
    };
    return weightMap[weight];
  };

  const getLineHeight = () => {
    if (variant === 'h1' || variant === 'h2' || variant === 'h3') {
      return theme.typography.lineHeight.tight;
    }
    return theme.typography.lineHeight.normal;
  };

  const getTextAlign = () => {
    const alignMap = {
      left: 'left',
      center: 'center',
      right: 'right',
    };
    return alignMap[align];
  };

  const getColor = () => {
    if (color && color.startsWith('text-')) {
      // Map Tailwind text colors to theme colors
      const colorMap: Record<string, string> = {
        'text-primary': theme.colors.text.primary,
        'text-secondary': theme.colors.text.secondary,
        'text-tertiary': theme.colors.text.tertiary,
        'text-gray-900': theme.colors.text.primary,
        'text-gray-600': theme.colors.text.secondary,
        'text-gray-500': theme.colors.text.tertiary,
      };
      return colorMap[color] || color;
    }
    return theme.colors.text.primary;
  };

  const Tag = getTag();

  return (
    <Tag
      id={id}
      data-testid={testId || `text-${id}`}
      className={`sdui-text ${className}`.trim()}
      style={{
        fontSize: getFontSize(),
        fontWeight: getFontWeight(),
        lineHeight: getLineHeight(),
        textAlign: getTextAlign(),
        color: color ? getColor() : theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.sans.join(', '),
        margin: 0,
        ...style,
      }}
    >
      {content}
    </Tag>
  );
}
