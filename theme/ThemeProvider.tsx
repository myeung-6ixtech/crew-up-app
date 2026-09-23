import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
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

const THEME_PREFERENCE_KEY = 'crewup.color-scheme';

type ThemeControls = {
  setColorScheme: (mode: ThemeMode) => void;
  toggleColorScheme: () => void;
};

const ThemeContext = createContext<Theme | null>(null);
const ThemeControlsContext = createContext<ThemeControls | null>(null);

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

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

async function readStoredMode(): Promise<ThemeMode | null> {
  try {
    if (Platform.OS === 'web') {
      const value = globalThis.localStorage?.getItem(THEME_PREFERENCE_KEY) ?? null;
      return isThemeMode(value) ? value : null;
    }
    const value = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
    return isThemeMode(value) ? value : null;
  } catch {
    return null;
  }
}

async function writeStoredMode(mode: ThemeMode): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(THEME_PREFERENCE_KEY, mode);
      return;
    }
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, mode);
  } catch {
    // Preference still applies for this session if storage is unavailable.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const systemMode: ThemeMode = systemScheme === 'dark' ? 'dark' : 'light';
  const [preference, setPreference] = useState<ThemeMode | null>(null);
  const mode = preference ?? systemMode;
  const theme = useMemo(() => buildTheme(mode), [mode]);

  useEffect(() => {
    let cancelled = false;
    void readStoredMode().then((stored) => {
      if (!cancelled && stored) setPreference(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setColorScheme = useCallback((next: ThemeMode) => {
    setPreference(next);
    void writeStoredMode(next);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorScheme(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setColorScheme]);

  const controls = useMemo(
    () => ({ setColorScheme, toggleColorScheme }),
    [setColorScheme, toggleColorScheme],
  );

  return (
    <ThemeControlsContext.Provider value={controls}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemeControlsContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}

export function useThemeControls(): ThemeControls {
  const controls = useContext(ThemeControlsContext);
  if (!controls) {
    throw new Error('useThemeControls must be used within ThemeProvider');
  }
  return controls;
}
