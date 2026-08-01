import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  darkColors,
  lightColors,
  motion,
  radius,
  shadow,
  spacing,
} from './tokens';
import { typography } from './typography';
import type { Theme, ThemeMode } from './types';

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(mode: ThemeMode): Theme {
  return {
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    shadow,
    typography,
    motion,
    mode,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === 'dark' ? 'dark' : 'light';
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}
