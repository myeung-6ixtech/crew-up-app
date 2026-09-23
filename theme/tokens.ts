/**
 * Color tokens — documentation/design-system.md §2.
 *
 * `fill` / `accent` is lime and is fill-only in light mode.
 * Text and icons use `accentText`. Labels on a lime fill use `onFill` (ink).
 * Legacy names (`bgCanvas`, `textPrimary`, …) alias the semantic tokens so
 * existing screens pick up the palette without a rename.
 */

export const lightColors = {
  ground: '#F7F8F4',
  card: '#FFFFFF',
  fill: '#A8E05F',
  accentText: '#4F6E19',
  ink: '#0E1113',
  /** Text and icons that sit on `fill`. Always ink — AAA on lime. */
  onFill: '#0E1113',

  bgCanvas: '#F7F8F4',
  bgSurface: '#FFFFFF',
  bgSurfaceRaised: '#FFFFFF',

  textPrimary: '#0E1113',
  textSecondary: '#526056',
  textTertiary: '#6B7368',
  /** Text on an ink surface (toasts), not text on lime. */
  textInverse: '#EDF1F2',

  accent: '#A8E05F',
  accentPressed: '#8FCB45',
  accentSubtle: '#E7F6C9',

  hairline: '#DDE2D6',

  statusAvailable: '#1AAE6F',
  statusOnDuty: '#E5484D',
  statusLayover: '#F5A623',
  statusVerified: '#2F80ED',

  scrim: 'rgba(14,17,19,0.48)',
} as const;

export const darkColors = {
  ground: '#0E1113',
  card: '#1C2124',
  fill: '#A8E05F',
  accentText: '#A8E05F',
  ink: '#EDF1F2',
  onFill: '#0E1113',
  /** Dark-mode only brand accent. Do not use in light mode. */
  secondary: '#E8C25A',

  bgCanvas: '#0E1113',
  bgSurface: '#1C2124',
  bgSurfaceRaised: '#1C2124',

  textPrimary: '#EDF1F2',
  textSecondary: '#B7C0C2',
  textTertiary: '#8B9496',
  textInverse: '#0E1113',

  accent: '#A8E05F',
  accentPressed: '#C3F07A',
  accentSubtle: '#243016',

  hairline: '#2A3134',

  statusAvailable: '#2ED18C',
  statusOnDuty: '#FF5B60',
  statusLayover: '#FFB84D',
  statusVerified: '#5B9DFF',

  scrim: 'rgba(0,0,0,0.6)',
} as const;

export type ColorTokens = typeof lightColors | typeof darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  cta: 8,
  input: 10,
  card: 16,
  sheet: 24,
  pill: 9999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;
