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

export type ThemePreference = ThemeMode | 'system';

type ThemeControls = {
  /** What the user picked in Appearance; `system` follows the device. */
  preference: ThemePreference;
  setColorScheme: (mode: ThemePreference) => void;
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

/** `null` clears the stored choice so the app follows the device again. */
async function writeStoredMode(mode: ThemeMode | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (mode) globalThis.localStorage?.setItem(THEME_PREFERENCE_KEY, mode);
      else globalThis.localStorage?.removeItem(THEME_PREFERENCE_KEY);
      return;
    }
    if (mode) await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, mode);
    else await SecureStore.deleteItemAsync(THEME_PREFERENCE_KEY);
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

  const setColorScheme = useCallback((next: ThemePreference) => {
    const stored = next === 'system' ? null : next;
    setPreference(stored);
    void writeStoredMode(stored);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorScheme(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setColorScheme]);

  const controls = useMemo(
    () => ({ preference: preference ?? ('system' as const), setColorScheme, toggleColorScheme }),
    [preference, setColorScheme, toggleColorScheme],
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
