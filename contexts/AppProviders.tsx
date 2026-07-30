import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { StoredSession } from '@nhost/nhost-js';
import { ApolloProvider } from '@/lib/apolloHooks';
import { nhost } from '@/lib/nhost';
import { apolloClient, createApolloClient } from '@/lib/apollo';
import { secureStoreSession } from '@/lib/secureStoreSession';
import type { Profile } from '@/types/domain';
import { GET_MY_PROFILE } from '@/graphql/mutations/profile';

interface SessionContextValue {
  session: StoredSession | null;
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [client] = useState(() => createApolloClient());

  const refreshProfile = useCallback(async () => {
    const current = nhost.getUserSession();
    if (!current?.user?.id) {
      setProfile(null);
      return;
    }
    try {
      const { data } = await client.query<{ profiles_by_pk: Profile | null }>({
        query: GET_MY_PROFILE,
        variables: { userId: current.user.id },
        fetchPolicy: 'network-only',
      });
      setProfile(data?.profiles_by_pk ?? null);
    } catch {
      setProfile(null);
    }
  }, [client]);

  const refreshSession = useCallback(async () => {
    await secureStoreSession.getAsync();
    await nhost.refreshSession(60);
    const next = nhost.getUserSession();
    setSession(next);
    if (next?.user?.id) {
      await refreshProfile();
    } else {
      setProfile(null);
    }
  }, [refreshProfile]);

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
        setProfile(null);
      }
    });
    return unsubscribe;
  }, [refreshProfile]);

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
    setProfile(null);
    await client.clearStore();
  }, [client]);

  const value = useMemo(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      profile,
      loading,
      refreshSession,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, refreshSession, refreshProfile, signOut],
  );

  return (
    <SessionContext.Provider value={value}>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used within AppProviders');
  return ctx;
}

export { apolloClient };
