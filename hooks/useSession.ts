import { useSessionContext } from '@/contexts/AppProviders';
import { hasCompletedOnboarding, hasProfileRow } from '@/lib/profileCompletion';

export function useSession() {
  return useSessionContext();
}

export function useAuth() {
  const { session, profile, loading, userId } = useSessionContext();
  return {
    isAuthenticated: Boolean(session?.user?.id),
    isVerified: Boolean(profile?.is_verified),
    /** True when a profiles row exists (including empty/incomplete). */
    hasProfile: hasProfileRow(profile),
    /** True when display name is set — onboarding is done. */
    hasCompletedOnboarding: hasCompletedOnboarding(profile),
    user: session?.user ?? null,
    profile,
    userId,
    loading,
  };
}
