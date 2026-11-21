/**
 * Material 3 Expressive Theme
 * https://m3.material.io/styles/expressive
 */

// Core color palette - Expressive dark theme
export const colors = {
  // Surface colors
  surface: '#070A08',
  surfaceContainer: '#161B17',
  surfaceContainerHigh: '#1E251F',
  surfaceContainerHighest: '#272F28',
  surfaceContainerLow: '#111611',
  surfaceVariant: '#1C241D',

  // Background
  background: '#070A08',

  // Borders & outlines
  border: '#25392C',
  outline: '#3A4F42',
  outlineVariant: '#2E4135',

  // Text colors
  text: '#EAF2EC',
  textPrimary: '#EAF2EC',
  textSecondary: '#8CA398',
  textTertiary: '#6A7A70',
  textDisabled: '#4A554C',

  // Primary (Green accent for Xbox/Vibrant)
  primary: '#0F9D32',
  onPrimary: '#FFFFFF',
  primaryContainer: '#1C7D2C',
  onPrimaryContainer: '#E8F5E9',
  primaryDim: 'rgba(15, 157, 50, 0.88)',

  // Secondary (Teal accent)
  secondary: '#3EB771',
  onSecondary: '#000000',
  secondaryContainer: '#28654D',
  onSecondaryContainer: '#E1F7ED',

  // Tertiary (Blue accent)
  tertiary: '#5DA9C9',
  onTertiary: '#000000',
  tertiaryContainer: '#1F4E65',
  onTertiaryContainer: '#E2F4FC',

  // Error
  error: '#CF6679',
  onError: '#000000',
  errorContainer: '#36111D',
  onErrorContainer: '#FFDAD9',

  // Success
  success: '#69BB65',
  onSuccess: '#000000',

  // Warning
  warning: '#FFB74D',
  onWarning: '#000000',

  // Danger/Red
  danger: '#DF4A4A',
  dangerContainer: '#4A1C1C',
  onDanger: '#FFFFFF',

  // Accent colors (interactive states)
  accent: '#1DB865',
  accentBright: '#4DDF7A',
  accentSoft: 'rgba(29, 184, 101, 0.16)',
  accentContainer: '#1C4D32',

  // Disabled states
  disabled: '#4A554C',
  disabledOverlay: 'rgba(255, 255, 255, 0.12)',
};

// Radius values
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
};

// Elevation shadows (M3 style)
export const elevation = {
  level0: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  level3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  level4: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 10,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// Typography
export const typography = {
  displayLarge: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  displaySmall: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  headlineLarge: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.1,
  },
  titleLarge: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
};

// Easing functions for animations
export const easing = {
  standard: (t: number) => t,
  decelerate: (t: number) => 1 - Math.pow(1 - t, 3),
  accelerate: (t: number) => Math.pow(t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

// Animation durations
export const duration = {
  short: 100,
  medium: 200,
  long: 300,
  extraLong: 500,
};