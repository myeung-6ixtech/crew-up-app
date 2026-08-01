import { useMemo } from 'react';
import type { StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import type { Theme } from './types';

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
