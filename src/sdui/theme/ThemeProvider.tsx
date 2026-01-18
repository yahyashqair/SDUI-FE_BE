/**
 * SDUI Theme Provider
 *
 * Provides theme context to all SDUI components.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Theme, ThemeContextValue, ThemeMode } from './types';
import { themes, type ThemeName } from './themes';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  defaultMode?: ThemeMode;
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({
  children,
  defaultTheme = 'light',
  defaultMode = 'light',
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  const theme = useMemo(() => {
    return themes[themeName];
  }, [themeName]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeName(newTheme.name as ThemeName);
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      setTheme,
      setMode,
    }),
    [theme, mode, setTheme]
  );

  // Apply theme to document root
  React.useEffect(() => {
    const root = document.documentElement;

    // Apply CSS variables for theme colors
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-foreground', theme.colors.primaryForeground);
    root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--color-primary-active', theme.colors.primaryActive);

    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-secondary-foreground', theme.colors.secondaryForeground);

    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-accent-foreground', theme.colors.accentForeground);

    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-surface-variant', theme.colors.surfaceVariant);

    root.style.setProperty('--color-text-primary', theme.colors.text.primary);
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
    root.style.setProperty('--color-text-tertiary', theme.colors.text.tertiary);

    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-info', theme.colors.info);

    // Apply border radius
    root.style.setProperty('--radius-sm', theme.borderRadius.sm);
    root.style.setProperty('--radius-md', theme.borderRadius.md);
    root.style.setProperty('--radius-lg', theme.borderRadius.lg);
    root.style.setProperty('--radius-xl', theme.borderRadius.xl);
    root.style.setProperty('--radius-full', theme.borderRadius.full);

    // Apply shadows
    root.style.setProperty('--shadow-sm', theme.shadows.sm);
    root.style.setProperty('--shadow-md', theme.shadows.md);
    root.style.setProperty('--shadow-lg', theme.shadows.lg);
    root.style.setProperty('--shadow-xl', theme.shadows.xl);

    // Apply fonts
    root.style.setProperty('--font-sans', theme.typography.fontFamily.sans.join(', '));
  }, [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <div
        className="sdui-themed"
        style={{
          color: theme.colors.text.primary,
          backgroundColor: theme.colors.background,
          fontFamily: theme.typography.fontFamily.sans.join(', '),
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get current theme
 * Returns the light theme as fallback when not in a ThemeProvider (for SSR compatibility)
 */
export function useCurrentTheme(): Theme {
  try {
    const { theme } = useTheme();
    return theme;
  } catch {
    // Return light theme as fallback when not in ThemeProvider (SSR)
    return themes.light;
  }
}
