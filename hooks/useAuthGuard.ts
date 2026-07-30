import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';

export function useAuthGuard() {
  const { isAuthenticated, isVerified, hasProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuth) {
      router.replace(SCREENS.auth.login);
      return;
    }

    if (isAuthenticated && inAuth) {
      if (!hasProfile) {
        router.replace(SCREENS.onboarding.index);
      } else if (!isVerified) {
        router.replace(SCREENS.onboarding.verification);
      } else {
        router.replace(SCREENS.tabs.home);
      }
      return;
    }

    if (isAuthenticated && !hasProfile && !inOnboarding) {
      router.replace(SCREENS.onboarding.index);
      return;
    }

    if (isAuthenticated && hasProfile && !isVerified && !inOnboarding) {
      router.replace(SCREENS.onboarding.verification);
      return;
    }

    const protectedTabs = ['network', 'events', 'messages'];
    const tab = segments.at(1);
    if (
      isAuthenticated &&
      hasProfile &&
      !isVerified &&
      segments[0] === '(tabs)' &&
      tab &&
      protectedTabs.includes(tab)
    ) {
      router.replace(SCREENS.onboarding.verification);
    }
  }, [isAuthenticated, isVerified, hasProfile, loading, segments, router]);
}
