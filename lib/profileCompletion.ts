import type { OnboardingStateRow, Profile } from '@/types/domain';

/** Profile row exists in the database (may still be empty / incomplete). */
export function hasProfileRow(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.user_id);
}

/** Launch onboarding finished (`onboarding_state.onboarding_completed_at` is write-once server-side). */
export function hasCompletedOnboarding(onboarding: OnboardingStateRow | null | undefined): boolean {
  return Boolean(onboarding?.onboarding_completed_at);
}
