/** Design tokens — see documentation/design-system.md §2 */

export const lightColors = {
  bgCanvas: '#FFFFFF',
  bgSurface: '#F6F5F9',
  bgSurfaceRaised: '#FFFFFF',

  textPrimary: '#101114',
  textSecondary: '#5B5D6B',
  textTertiary: '#9294A3',
  textInverse: '#FFFFFF',

  accent: '#7132F5',
  accentPressed: '#5B27C4',
  accentSubtle: '#F1EBFE',

  hairline: '#E7E6EE',

  statusAvailable: '#1AAE6F',
  statusOnDuty: '#E5484D',
  statusLayover: '#F5A623',
  statusVerified: '#2F80ED',

  scrim: 'rgba(16,17,20,0.48)',
} as const;

export const darkColors = {
  bgCanvas: '#0E0D12',
  bgSurface: '#17151D',
  bgSurfaceRaised: '#1F1C27',

  textPrimary: '#F5F4F8',
  textSecondary: '#A6A4B3',
  textTertiary: '#6E6C7C',
  textInverse: '#101114',

  accent: '#9D6BFF',
  accentPressed: '#B389FF',
  accentSubtle: '#241A3D',

  hairline: '#2A2733',

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
