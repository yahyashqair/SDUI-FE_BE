/**
 * SDUI Theme Definitions
 *
 * Pre-built beautiful themes for SDUI components.
 */

import type { Theme } from './types';

/**
 * Light Theme - Clean and modern
 */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',

    secondary: '#6b7280',
    secondaryForeground: '#ffffff',
    secondaryHover: '#4b5563',
    secondaryActive: '#374151',

    accent: '#8b5cf6',
    accentForeground: '#ffffff',

    background: '#ffffff',
    surface: '#f9fafb',
    surfaceVariant: '#f3f4f6',

    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },

    border: '#e5e7eb',
    borderLight: '#f3f4f6',

    success: '#10b981',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#ffffff',
    error: '#ef4444',
    errorForeground: '#ffffff',
    info: '#3b82f6',
    infoForeground: '#ffffff',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['Fira Code', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
};

/**
 * Dark Theme - Easy on the eyes
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#60a5fa',
    primaryForeground: '#ffffff',
    primaryHover: '#3b82f6',
    primaryActive: '#2563eb',

    secondary: '#9ca3af',
    secondaryForeground: '#ffffff',
    secondaryHover: '#6b7280',
    secondaryActive: '#4b5563',

    accent: '#a78bfa',
    accentForeground: '#ffffff',

    background: '#111827',
    surface: '#1f2937',
    surfaceVariant: '#374151',

    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
      inverse: '#111827',
    },

    border: '#374151',
    borderLight: '#4b5563',

    success: '#34d399',
    successForeground: '#ffffff',
    warning: '#fbbf24',
    warningForeground: '#ffffff',
    error: '#f87171',
    errorForeground: '#ffffff',
    info: '#60a5fa',
    infoForeground: '#ffffff',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['Fira Code', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
  },
};

/**
 * Ocean Theme - Calming blue tones
 */
export const oceanTheme: Theme = {
  name: 'ocean',
  colors: {
    primary: '#0ea5e9',
    primaryForeground: '#ffffff',
    primaryHover: '#0284c7',
    primaryActive: '#0369a1',

    secondary: '#64748b',
    secondaryForeground: '#ffffff',
    secondaryHover: '#475569',
    secondaryActive: '#334155',

    accent: '#06b6d4',
    accentForeground: '#ffffff',

    background: '#f0f9ff',
    surface: '#e0f2fe',
    surfaceVariant: '#bae6fd',

    text: {
      primary: '#0c4a6e',
      secondary: '#075985',
      tertiary: '#0369a1',
      inverse: '#ffffff',
    },

    border: '#bae6fd',
    borderLight: '#e0f2fe',

    success: '#14b8a6',
    successForeground: '#ffffff',
    warning: '#f97316',
    warningForeground: '#ffffff',
    error: '#dc2626',
    errorForeground: '#ffffff',
    info: '#0ea5e9',
    infoForeground: '#ffffff',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      serif: ['Merriweather', 'Georgia', 'serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(14 165 233 / 0.1)',
    md: '0 4px 6px -1px rgb(14 165 233 / 0.15), 0 2px 4px -2px rgb(14 165 233 / 0.15)',
    lg: '0 10px 15px -3px rgb(14 165 233 / 0.15), 0 4px 6px -4px rgb(14 165 233 / 0.15)',
    xl: '0 20px 25px -5px rgb(14 165 233 / 0.15), 0 8px 10px -6px rgb(14 165 233 / 0.15)',
    '2xl': '0 25px 50px -12px rgb(14 165 233 / 0.25)',
  },
};

/**
 * Forest Theme - Natural green tones
 */
export const forestTheme: Theme = {
  name: 'forest',
  colors: {
    primary: '#22c55e',
    primaryForeground: '#ffffff',
    primaryHover: '#16a34a',
    primaryActive: '#15803d',

    secondary: '#78716c',
    secondaryForeground: '#ffffff',
    secondaryHover: '#57534e',
    secondaryActive: '#44403c',

    accent: '#84cc16',
    accentForeground: '#ffffff',

    background: '#f0fdf4',
    surface: '#dcfce7',
    surfaceVariant: '#bbf7d0',

    text: {
      primary: '#14532d',
      secondary: '#166534',
      tertiary: '#15803d',
      inverse: '#ffffff',
    },

    border: '#bbf7d0',
    borderLight: '#dcfce7',

    success: '#22c55e',
    successForeground: '#ffffff',
    warning: '#eab308',
    warningForeground: '#ffffff',
    error: '#ef4444',
    errorForeground: '#ffffff',
    info: '#22c55e',
    infoForeground: '#ffffff',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      serif: ['Crimson Pro', 'Georgia', 'serif'],
      mono: ['IBM Plex Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(34 197 94 / 0.1)',
    md: '0 4px 6px -1px rgb(34 197 94 / 0.15), 0 2px 4px -2px rgb(34 197 94 / 0.15)',
    lg: '0 10px 15px -3px rgb(34 197 94 / 0.15), 0 4px 6px -4px rgb(34 197 94 / 0.15)',
    xl: '0 20px 25px -5px rgb(34 197 94 / 0.15), 0 8px 10px -6px rgb(34 197 94 / 0.15)',
    '2xl': '0 25px 50px -12px rgb(34 197 94 / 0.25)',
  },
};

/**
 * Sunset Theme - Warm orange and purple tones
 */
export const sunsetTheme: Theme = {
  name: 'sunset',
  colors: {
    primary: '#f97316',
    primaryForeground: '#ffffff',
    primaryHover: '#ea580c',
    primaryActive: '#c2410c',

    secondary: '#a8a29e',
    secondaryForeground: '#ffffff',
    secondaryHover: '#78716c',
    secondaryActive: '#57534e',

    accent: '#a855f7',
    accentForeground: '#ffffff',

    background: '#fff7ed',
    surface: '#ffedd5',
    surfaceVariant: '#fed7aa',

    text: {
      primary: '#7c2d12',
      secondary: '#9a3412',
      tertiary: '#c2410c',
      inverse: '#ffffff',
    },

    border: '#fed7aa',
    borderLight: '#ffedd5',

    success: '#22c55e',
    successForeground: '#ffffff',
    warning: '#eab308',
    warningForeground: '#ffffff',
    error: '#ef4444',
    errorForeground: '#ffffff',
    info: '#f97316',
    infoForeground: '#ffffff',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  typography: {
    fontFamily: {
      sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'],
      mono: ['Fira Code', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(249 115 22 / 0.1)',
    md: '0 4px 6px -1px rgb(249 115 22 / 0.15), 0 2px 4px -2px rgb(249 115 22 / 0.15)',
    lg: '0 10px 15px -3px rgb(249 115 22 / 0.15), 0 4px 6px -4px rgb(249 115 22 / 0.15)',
    xl: '0 20px 25px -5px rgb(249 115 22 / 0.15), 0 8px 10px -6px rgb(249 115 22 / 0.15)',
    '2xl': '0 25px 50px -12px rgb(249 115 22 / 0.25)',
  },
};

/**
 * All available themes
 */
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
} as const;

export type ThemeName = keyof typeof themes;
