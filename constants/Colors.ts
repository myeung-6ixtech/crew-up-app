/**
 * @deprecated Use `@/theme` and `useTheme()` instead.
 * Kept temporarily for Expo template components not yet removed.
 */
import { lightColors, darkColors } from '@/theme/tokens';

export default {
  light: {
    text: lightColors.textPrimary,
    background: lightColors.bgCanvas,
    tint: lightColors.accent,
    tabIconDefault: lightColors.textTertiary,
    tabIconSelected: lightColors.accent,
  },
  dark: {
    text: darkColors.textPrimary,
    background: darkColors.bgCanvas,
    tint: darkColors.accent,
    tabIconDefault: darkColors.textTertiary,
    tabIconSelected: darkColors.accent,
  },
};
