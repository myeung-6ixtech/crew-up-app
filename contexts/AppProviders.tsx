import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { StoredSession } from '@nhost/nhost-js';
import { ApolloProvider } from '@/lib/apolloHooks';
import { nhost } from '@/lib/nhost';
import { apolloClient, createApolloClient } from '@/lib/apollo';
import { secureStoreSession } from '@/lib/secureStoreSession';
import type { OnboardingStateRow, Profile } from '@/types/domain';
import { GET_MY_PROFILE } from '@/graphql/mutations/profile';
import { GET_MY_ONBOARDING_STATE } from '@/graphql/queries/onboarding';
import { isBackendSchemaError } from '@/lib/graphqlError';
import { ThemeProvider } from '@/theme';

/** `error` = never loaded successfully this session; routing must not guess onboarding status. */
export type OnboardingStatus = 'idle' | 'loading' | 'ready' | 'error';

interface SessionContextValue {
  session: StoredSession | null;
  userId: string | null;
  profile: Profile | null;
  onboarding: OnboardingStateRow | null;
  onboardingStatus: OnboardingStatus;
  loading: boolean;
  refreshSession: () => Promise<Profile | null>;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStateRow | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [client] = useState(() => createApolloClient());
  const profileRef = useRef<Profile | null>(null);
  const onboardingLoadedRef = useRef(false);

  const clearAccount = useCallback(() => {
    profileRef.current = null;
    onboardingLoadedRef.current = false;
    setProfile(null);
    setOnboarding(null);
    setOnboardingStatus('idle');
  }, []);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    const current = nhost.getUserSession();
    if (!current?.user?.id) {
      clearAccount();
      return null;
    }
    const variables = { userId: current.user.id };
    if (!onboardingLoadedRef.current) setOnboardingStatus('loading');

    const [profileResult, onboardingResult] = await Promise.allSettled([
      client.query<{ profiles_by_pk: Profile | null }>({
        query: GET_MY_PROFILE,
        variables,
        fetchPolicy: 'network-only',
      }),
      client.query<{ onboarding_state_by_pk: OnboardingStateRow | null }>({
        query: GET_MY_ONBOARDING_STATE,
        variables,
        fetchPolicy: 'network-only',
      }),
    ]);

    if (onboardingResult.status === 'fulfilled') {
      onboardingLoadedRef.current = true;
      setOnboarding(onboardingResult.value.data?.onboarding_state_by_pk ?? null);
      setOnboardingStatus('ready');
    } else {
      console.error('Onboarding state fetch failed:', onboardingResult.reason);
      // Keep the cached state; only surface an error when nothing was ever loaded.
      if (!onboardingLoadedRef.current) setOnboardingStatus('error');
    }

    if (profileResult.status === 'fulfilled') {
      const nextProfile = profileResult.value.data?.profiles_by_pk ?? null;
      profileRef.current = nextProfile;
      setProfile(nextProfile);
      return nextProfile;
    }
    const error = profileResult.reason;
    if (isBackendSchemaError(error)) {
      console.error('Profile fetch failed — backend schema may be out of date:', error);
    } else {
      console.error('Profile fetch failed:', error);
    }
    // Keep cached profile — fetch errors must not falsely send users to onboarding.
    return profileRef.current;
  }, [client, clearAccount]);

  const refreshSession = useCallback(async (): Promise<Profile | null> => {
    try {
      await secureStoreSession.getAsync();
      await nhost.refreshSession(60);
    } catch {
      nhost.clearSession();
      setSession(null);
      clearAccount();
      return null;
    }
    const next = nhost.getUserSession();
    setSession(next);
    if (next?.user?.id) {
      return refreshProfile();
    }
    clearAccount();
    return null;
  }, [refreshProfile, clearAccount]);

  useEffect(() => {
    void (async () => {
      try {
        await refreshSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshSession]);

  useEffect(() => {
    const unsubscribe = nhost.sessionStorage.onChange((next) => {
      setSession(next);
      if (next?.user?.id) {
        void refreshProfile();
      } else {
        clearAccount();
      }
    });
    return unsubscribe;
  }, [refreshProfile, clearAccount]);

  const signOut = useCallback(async () => {
    const current = nhost.getUserSession();
    if (current?.refreshToken) {
      try {
        await nhost.auth.signOut({ refreshToken: current.refreshToken });
      } catch {
        // Clear local session even if server sign-out fails.
      }
    }
    nhost.clearSession();
    setSession(null);
    clearAccount();
    await client.clearStore();
  }, [client, clearAccount]);

  const value = useMemo(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      profile,
      onboarding,
      onboardingStatus,
      loading,
      refreshSession,
      refreshProfile,
      signOut,
    }),
    [session, profile, onboarding, onboardingStatus, loading, refreshSession, refreshProfile, signOut],
  );

  return (
    <ThemeProvider>
      <SessionContext.Provider value={value}>
        <ApolloProvider client={client}>{children}</ApolloProvider>
      </SessionContext.Provider>
    </ThemeProvider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used within AppProviders');
  return ctx;
}

export { apolloClient };
