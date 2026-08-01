import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';

export function useAuthGuard() {
  const { isAuthenticated, hasProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuth) {
      router.replace(SCREENS.auth.welcome);
      return;
    }

    if (isAuthenticated && inAuth) {
      router.replace(hasProfile ? SCREENS.tabs.home : SCREENS.onboarding.index);
      return;
    }

    if (isAuthenticated && !hasProfile && !inOnboarding) {
      router.replace(SCREENS.onboarding.index);
      return;
    }

    if (isAuthenticated && hasProfile && inOnboarding) {
      router.replace(SCREENS.tabs.home);
    }
  }, [isAuthenticated, hasProfile, loading, segments, router]);
}
