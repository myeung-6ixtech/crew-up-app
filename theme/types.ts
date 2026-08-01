import type { ColorTokens } from './tokens';
import type { spacing, radius, shadow, motion } from './tokens';
import type { typography } from './typography';

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  typography: typeof typography;
  motion: typeof motion;
  mode: ThemeMode;
};
