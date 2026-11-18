import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const keyFor = (userId: string) => `crewup.matches.airlineOnly.${userId}`;

/**
 * "Your airline only" on Crossing Paths. Off (all airlines) by default; the choice is kept on this device per user,
 * so a different account signing in starts from off.
 */
export function useAirlineOnlyPreference(userId: string | null | undefined) {
  const [airlineOnly, setAirlineOnlyState] = useState(false);

  useEffect(() => {
    setAirlineOnlyState(false);
    if (!userId) return;
    let active = true;
    void SecureStore.getItemAsync(keyFor(userId))
      .then((stored) => {
        if (active) setAirlineOnlyState(stored === '1');
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId]);

  const setAirlineOnly = useCallback(
    (next: boolean) => {
      setAirlineOnlyState(next);
      if (userId) void SecureStore.setItemAsync(keyFor(userId), next ? '1' : '0').catch(() => undefined);
    },
    [userId],
  );

  return [airlineOnly, setAirlineOnly] as const;
}
