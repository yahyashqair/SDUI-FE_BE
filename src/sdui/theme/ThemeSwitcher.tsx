/**
 * SDUI Theme Switcher Component
 *
 * Allows users to switch between different themes.
 */

import React from 'react';
import { useTheme, useCurrentTheme } from './ThemeProvider';
import { themes, type ThemeName } from './themes';

export interface ThemeSwitcherProps {
  className?: string;
  style?: React.CSSProperties;
}

const themeLabels: Record<ThemeName, string> = {
  light: '☀️ Light',
  dark: '🌙 Dark',
  ocean: '🌊 Ocean',
  forest: '🌲 Forest',
  sunset: '🌅 Sunset',
};

export function ThemeSwitcher({ className = '', style }: ThemeSwitcherProps) {
  const { theme: currentTheme, setTheme } = useTheme();

  return (
    <div
      className={`sdui-theme-switcher ${className}`.trim()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        backgroundColor: currentTheme.colors.surface,
        border: `1px solid ${currentTheme.colors.border}`,
        borderRadius: currentTheme.borderRadius.xl,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: currentTheme.typography.fontSize.sm,
          fontWeight: currentTheme.typography.fontWeight.medium,
          color: currentTheme.colors.text.secondary,
          marginRight: '0.5rem',
        }}
      >
        Theme:
      </span>
      {(Object.keys(themes) as ThemeName[]).map((themeName) => (
        <button
          key={themeName}
          onClick={() => setTheme(themes[themeName])}
          style={{
            padding: '0.5rem 1rem',
            fontSize: currentTheme.typography.fontSize.sm,
            fontWeight: currentTheme.typography.fontWeight.medium,
            backgroundColor: currentTheme.name === themeName ? currentTheme.colors.primary : 'transparent',
            color: currentTheme.name === themeName ? currentTheme.colors.primaryForeground : currentTheme.colors.text.secondary,
            border: currentTheme.name === themeName ? 'none' : `1px solid ${currentTheme.colors.border}`,
            borderRadius: currentTheme.borderRadius.md,
            cursor: 'pointer',
            transition: 'all 150ms ease-in-out',
            fontFamily: currentTheme.typography.fontFamily.sans.join(', '),
          }}
          onMouseEnter={(e) => {
            if (currentTheme.name !== themeName) {
              e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceVariant;
            }
          }}
          onMouseLeave={(e) => {
            if (currentTheme.name !== themeName) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {themeLabels[themeName]}
        </button>
      ))}
    </div>
  );
}
