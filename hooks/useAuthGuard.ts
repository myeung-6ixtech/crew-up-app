import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';

export function useAuthGuard() {
  const { isAuthenticated, hasCompletedOnboarding, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const onProfileSetup = inOnboarding && segments.length === 1;

    if (!isAuthenticated && !inAuth) {
      router.replace(SCREENS.auth.welcome);
      return;
    }

    if (isAuthenticated && inAuth) {
      router.replace(
        hasCompletedOnboarding ? SCREENS.tabs.home : SCREENS.onboarding.index,
      );
      return;
    }

    if (isAuthenticated && !hasCompletedOnboarding && !inOnboarding) {
      router.replace(SCREENS.onboarding.index);
      return;
    }

    if (isAuthenticated && hasCompletedOnboarding && onProfileSetup) {
      router.replace(SCREENS.tabs.home);
    }
  }, [isAuthenticated, hasCompletedOnboarding, loading, segments, router]);
}
