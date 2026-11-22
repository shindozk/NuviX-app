/**
 * NuviX design tokens — Material 3 (Material You), dark scheme.
 *
 * Everything is derived from a single green seed through the Material 3 tonal
 * system: five surface-container levels, full color roles (primary / secondary /
 * tertiary / error), a shape scale, a type scale and a motion spec. Components
 * should never hard-code a colour, a radius or a duration — use these tokens.
 *
 * Reference: https://m3.material.io/styles/color/roles
 */

import { Easing } from 'react-native';

/* ------------------------------------------------------------------ *
 * Colour helpers
 * ------------------------------------------------------------------ */

/** Keeps opacity values inside a sane range and readable in source. */
const clampOpacity = (value: number) => Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));

/** `#RRGGBB` (or `#RGB`) + opacity → `rgba(...)`. */
export function alpha(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const value = parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${clampOpacity(opacity)})`;
}

/* ------------------------------------------------------------------ *
 * Colour roles (M3 dark scheme, green seed)
 * ------------------------------------------------------------------ */

const scheme = {
  // Primary — the brand accent, used sparingly for emphasis.
  primary: '#8CE39F',
  onPrimary: '#00391C',
  primaryContainer: '#0F5A30',
  onPrimaryContainer: '#B8F5C7',
  inversePrimary: '#2F6B45',

  // Secondary — quieter companion tone for selected controls.
  secondary: '#B4CCB9',
  onSecondary: '#1D3527',
  secondaryContainer: '#334A3B',
  onSecondaryContainer: '#D0EBD6',

  // Tertiary — cool counterpoint so the UI never reads monochrome.
  tertiary: '#9ED0E4',
  onTertiary: '#00344A',
  tertiaryContainer: '#1B4B61',
  onTertiaryContainer: '#C4E7F8',

  // Error.
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#4A1512',
  onErrorContainer: '#FFDAD6',

  // Neutrals — a hint of green keeps the blacks from feeling dead.
  surface: '#0E120F',
  surfaceDim: '#0A0D0B',
  surfaceBright: '#343A35',
  surfaceContainerLowest: '#090C0A',
  surfaceContainerLow: '#161A17',
  surfaceContainer: '#1B1F1C',
  surfaceContainerHigh: '#252A26',
  surfaceContainerHighest: '#303531',
  onSurface: '#E2E8E3',
  onSurfaceVariant: '#B8C1B9',
  outline: '#838D84',
  outlineVariant: '#3E453F',

  inverseSurface: '#E2E8E3',
  onInverseSurface: '#2F352F',

  scrim: '#000000',
  shadow: '#000000',
} as const;

/**
 * Semantic aliases. `colors.*` is what components use; the M3 role names above
 * stay available for call sites that want the exact spec wording.
 */
export const colors = {
  ...scheme,

  // Surfaces (the M3 "surface container" ladder).
  background: scheme.surface,
  surfaceVariant: scheme.surfaceContainerHigh,

  // Text.
  text: scheme.onSurface,
  textPrimary: scheme.onSurface,
  textSecondary: scheme.onSurfaceVariant,
  textTertiary: scheme.outline,
  textDisabled: scheme.outlineVariant,

  // Borders.
  border: scheme.outlineVariant,
  outline: scheme.outline,
  outlineVariant: scheme.outlineVariant,

  // Accent aliases.
  accent: scheme.primary,
  accentBright: scheme.onPrimaryContainer,
  accentSoft: alpha(scheme.primary, 0.14),
  accentContainer: scheme.primaryContainer,
  onAccentContainer: scheme.onPrimaryContainer,

  // Semantic states.
  success: '#9BE2A6',
  onSuccess: '#00210B',
  successContainer: '#1E4A2B',
  warning: '#F5C46B',
  onWarning: '#3A2A00',
  warningContainer: '#4A3608',
  danger: scheme.error,
  onDanger: scheme.onError,
  dangerContainer: scheme.errorContainer,
  onDangerContainer: scheme.onErrorContainer,

  // Translucent helpers used by the on-screen controls.
  scrim: scheme.scrim,
  shadow: scheme.shadow,
  controlFill: alpha(scheme.onSurface, 0.07),
  controlFillPressed: alpha(scheme.onSurface, 0.14),
  controlOutline: alpha(scheme.onSurface, 0.16),
  controlOutlineStrong: alpha(scheme.onSurface, 0.28),
  dockFill: alpha(scheme.surfaceContainerHigh, 0.72),

  disabled: scheme.outlineVariant,
  disabledOverlay: alpha(scheme.onSurface, 0.12),
};

/* ------------------------------------------------------------------ *
 * Shape — M3 shape scale
 * ------------------------------------------------------------------ */

export const shape = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 999,
} as const;

/** Backwards-compatible alias of `shape`. */
export const radius = {
  xs: shape.xs,
  sm: shape.sm,
  md: shape.md,
  lg: shape.lg,
  xl: shape.xl,
  xxl: shape.xxl,
  full: shape.full,
  pill: shape.full,
} as const;

/* ------------------------------------------------------------------ *
 * Spacing — 4dp grid
 * ------------------------------------------------------------------ */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

/* ------------------------------------------------------------------ *
 * Typography — M3 type scale
 * ------------------------------------------------------------------ */

export const typeScale = {
  displayLarge: { fontSize: 52, lineHeight: 60, fontWeight: '400' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 44, lineHeight: 52, fontWeight: '400' as const, letterSpacing: 0 },
  displaySmall: { fontSize: 34, lineHeight: 42, fontWeight: '400' as const, letterSpacing: 0 },

  headlineLarge: { fontSize: 30, lineHeight: 38, fontWeight: '600' as const, letterSpacing: -0.2 },
  headlineMedium: { fontSize: 26, lineHeight: 34, fontWeight: '600' as const, letterSpacing: -0.2 },
  headlineSmall: { fontSize: 22, lineHeight: 30, fontWeight: '600' as const, letterSpacing: -0.1 },

  titleLarge: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -0.1 },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, letterSpacing: 0.1 },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0.1 },

  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, letterSpacing: 0.2 },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, letterSpacing: 0.2 },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0.3 },

  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.4 },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.8 },
} as const;

/** Backwards-compatible alias of `typeScale`. */
export const typography = typeScale;

/* ------------------------------------------------------------------ *
 * Elevation — a soft shadow for floating layers
 * ------------------------------------------------------------------ */

const shadowStyle = (radiusValue: number, opacity: number, elevation: number) => ({
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: Math.round(radiusValue / 2) },
  shadowOpacity: opacity,
  shadowRadius: radiusValue,
  elevation,
});

export const elevation = {
  level0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: shadowStyle(2, 0.28, 1),
  level2: shadowStyle(4, 0.3, 3),
  level3: shadowStyle(8, 0.32, 6),
  level4: shadowStyle(14, 0.34, 10),
  level5: shadowStyle(22, 0.36, 14),
} as const;

/* ------------------------------------------------------------------ *
 * Motion — M3 durations and easing curves
 * ------------------------------------------------------------------ */

export const duration = {
  /** M3 short1–short4. */
  short1: 80,
  short2: 120,
  short3: 160,
  short4: 200,
  /** M3 medium1–medium4. */
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  /** M3 long1–long2. */
  long1: 450,
  long2: 500,
  /** M3 extraLong1–extraLong2. */
  extraLong1: 700,
  extraLong2: 900,

  // Friendly aliases.
  short: 140,
  medium: 280,
  long: 420,
  extraLong: 700,
} as const;

export const easing = {
  /** M3 "standard" — most movement inside the app. */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** M3 "emphasized" — expressive enter/exit. */
  emphasized: Easing.bezier(0.2, 0, 0, 1),
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1),
  emphasizedAccelerate: Easing.bezier(0.3, 0, 0.8, 0.15),
  legacy: Easing.bezier(0.4, 0, 0.2, 1),
  linear: Easing.linear,
  decelerate: (t: number) => 1 - Math.pow(1 - t, 3),
  accelerate: (t: number) => t * t * t,
  easeInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
} as const;

/** Spring presets so every component settles the same way. */
export const spring = {
  gentle: { damping: 18, stiffness: 120, mass: 1 },
  standard: { damping: 16, stiffness: 180, mass: 1 },
  snappy: { damping: 14, stiffness: 260, mass: 0.7 },
  bouncy: { damping: 10, stiffness: 220, mass: 0.9 },
} as const;
