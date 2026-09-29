import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppConfigSchema, type AppMode } from '@crewup/shared';
import { apiEndpoints } from '@/lib/api/endpoints';

/**
 * The only client-side reader of the app mode (onboarding.md §2.2). Mode comes from
 * GET /public/app-config at runtime; on failure the last cached value is used, and with no
 * cache the status is "error" — never a silent default to "launched".
 */
export type AppModeStatus = 'loading' | 'ready' | 'error';
type AppModeSnapshot = { mode: AppMode | null; status: AppModeStatus };

const CACHE_KEY = 'crewup.appMode';
const STALE_AFTER_MS = 60_000;
/** Local development override only; production builds always use app-config. */
const DEV_OVERRIDE = __DEV__ ? process.env.EXPO_PUBLIC_CREWUP_APP_MODE : undefined;

let snapshot: AppModeSnapshot = { mode: null, status: 'loading' };
let fetchedAt = 0;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: AppModeSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

async function readCache(): Promise<AppMode | null> {
  try {
    const cached = await SecureStore.getItemAsync(CACHE_KEY);
    const parsed = AppConfigSchema.shape.mode.safeParse(cached);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function load(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && snapshot.status === 'ready' && Date.now() - fetchedAt < STALE_AFTER_MS) return;

  inFlight = (async () => {
    const override = AppConfigSchema.shape.mode.safeParse(DEV_OVERRIDE);
    if (override.success) {
      fetchedAt = Date.now();
      publish({ mode: override.data, status: 'ready' });
      return;
    }
    try {
      const response = await fetch(`${apiEndpoints.functions}/public/app-config`);
      if (!response.ok) throw new Error(`app-config ${response.status}`);
      const { mode } = AppConfigSchema.parse(await response.json());
      fetchedAt = Date.now();
      publish({ mode, status: 'ready' });
      void SecureStore.setItemAsync(CACHE_KEY, mode).catch(() => undefined);
    } catch (error) {
      if (__DEV__) console.warn('[appMode] app-config fetch failed', error);
      const cached = snapshot.mode ?? (await readCache());
      publish(cached ? { mode: cached, status: 'ready' } : { mode: null, status: 'error' });
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppMode(): AppModeSnapshot & { retry: () => Promise<void> } {
  const current = useSyncExternalStore(subscribe, () => snapshot);

  useEffect(() => {
    void load();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => subscription.remove();
  }, []);

  const retry = useCallback(async () => {
    publish({ ...snapshot, status: snapshot.mode ? 'ready' : 'loading' });
    await load(true);
  }, []);

  return { ...current, retry };
}
