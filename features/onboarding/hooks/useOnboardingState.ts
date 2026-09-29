import { useMemo } from 'react';
import { resolveEntryRoute, type OnboardingSnapshot } from '@crewup/shared';
import { useAppMode } from '@/hooks/useAppMode';
import { useSession } from '@/hooks/useSession';

/** Mode + onboarding_state + the resolved entry route (onboarding.md §3.1). */
export function useOnboardingState() {
  const { onboarding, onboardingStatus, refreshProfile } = useSession();
  const app = useAppMode();

  const snapshot: OnboardingSnapshot = useMemo(
    () =>
      onboarding
        ? {
            currentStep: onboarding.current_step,
            betaSignupCompletedAt: onboarding.beta_signup_completed_at,
            onboardingCompletedAt: onboarding.onboarding_completed_at,
          }
        : null,
    [onboarding],
  );

  const route = useMemo(() => resolveEntryRoute(app.mode, snapshot), [app.mode, snapshot]);

  return {
    mode: app.mode,
    modeStatus: app.status,
    retryMode: app.retry,
    state: onboarding,
    status: onboardingStatus,
    route,
    prefilledFromBeta: route.kind === 'onboarding' && route.variant === 'prefilled_from_beta',
    refresh: refreshProfile,
  };
}
