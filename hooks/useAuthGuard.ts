import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth, useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';
import { useHouseRulesStore } from '@/features/onboarding/houseRulesStore';
import { useOnboardingState } from '@/features/onboarding/hooks/useOnboardingState';
import { FLOW_SEGMENTS, onboardingHref } from '@/features/onboarding/navigation';

/** Deep-link landings that create a session and must stay put until the user taps on: 4E verified, 4L new password. */
const HELD_AUTH_SEGMENTS = new Set(['verified', 'reset']);

/** Profile screens a beta-holding user may open (edit only — no social surfaces). */
const BETA_ALLOWED_PROFILE_SEGMENTS = new Set(['edit', 'edit-section']);

/** Single routing authority: session → app mode + onboarding_state → `resolveEntryRoute`. */
export function useAuthGuard() {
  const { isAuthenticated, loading, userId } = useAuth();
  const { pendingDeletion } = useSession();
  const { route, status, modeStatus } = useOnboardingState();
  const houseRulesStatus = useHouseRulesStore((state) => state.status);
  const loadHouseRules = useHouseRulesStore((state) => state.load);
  const resetHouseRules = useHouseRulesStore((state) => state.reset);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!userId) {
      resetHouseRules();
      return;
    }
    void loadHouseRules(userId);
  }, [loadHouseRules, resetHouseRules, userId]);

  useEffect(() => {
    if (loading) return;

    const [root, child] = segments as string[];
    const inAuth = root === 'auth';
    const inOnboarding = root === 'onboarding';

    if (!isAuthenticated) {
      if (!inAuth) router.replace(SCREENS.auth.welcome);
      return;
    }

    if (inAuth && HELD_AUTH_SEGMENTS.has(child ?? '')) return;

    if (status === 'idle' || status === 'loading') return;

    // Inside the deletion grace period nothing else opens until they keep the account or sign out.
    if (pendingDeletion) {
      if (!(root === 'account' && child === 'deletion-pending')) router.replace(SCREENS.account.deletionPending);
      return;
    }
    if (root === 'account' && child === 'deletion-pending') {
      router.replace(SCREENS.tabs.home);
      return;
    }

    const unavailable = status === 'error' || (route.kind === 'mode_unavailable' && modeStatus !== 'loading');
    if (unavailable) {
      if (!(inOnboarding && child === 'unavailable')) router.replace(SCREENS.onboarding.unavailable);
      return;
    }

    switch (route.kind) {
      case 'mode_unavailable':
        return;
      case 'main':
        // roster-intro is the post-completion hand-off; everything else in onboarding is closed.
        if (inAuth || (inOnboarding && child !== 'roster-intro')) router.replace(SCREENS.tabs.home);
        return;
      case 'beta_holding': {
        const allowed =
          (inOnboarding && child === 'beta-holding') ||
          (root === 'profile' && BETA_ALLOWED_PROFILE_SEGMENTS.has(child ?? '')) ||
          (root === 'account' && child === 'delete');
        if (!allowed) router.replace(SCREENS.onboarding.betaHolding);
        return;
      }
      case 'onboarding': {
        if (route.step === 'name_handle' && houseRulesStatus === 'unknown') return;
        if (route.step === 'name_handle' && houseRulesStatus === 'required') {
          if (!(inOnboarding && child === 'house-rules')) router.replace(SCREENS.onboarding.houseRules);
          return;
        }
        if (inOnboarding && child === 'house-rules') {
          router.replace(onboardingHref(route.step));
          return;
        }
        if (!inOnboarding || !FLOW_SEGMENTS.has(child ?? '')) router.replace(onboardingHref(route.step));
        return;
      }
    }
  }, [houseRulesStatus, isAuthenticated, loading, modeStatus, pendingDeletion, route, router, segments, status]);
}
