import { useSessionContext } from '@/contexts/AppProviders';

export function useSession() {
  return useSessionContext();
}

export function useAuth() {
  const { session, profile, loading, userId } = useSessionContext();
  return {
    isAuthenticated: Boolean(session?.user?.id),
    isVerified: Boolean(profile?.is_verified),
    hasProfile: Boolean(profile),
    user: session?.user ?? null,
    profile,
    userId,
    loading,
  };
}
