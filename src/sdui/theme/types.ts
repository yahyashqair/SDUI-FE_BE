/**
 * SDUI Theme System Types
 *
 * Comprehensive theming support for SDUI components.
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryForeground: string;
  primaryHover: string;
  primaryActive: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;
  secondaryHover: string;
  secondaryActive: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Background colors
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };

  // Border colors
  border: string;
  borderLight: string;

  // Status colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: ThemeMode) => void;
}
