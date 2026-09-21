import type { Profile } from '@/types/domain';

/** Profile row exists in the database (may still be empty / incomplete). */
export function hasProfileRow(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.user_id);
}

/** User finished profile setup — used to gate onboarding vs main app. */
export function hasCompletedOnboarding(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.display_name?.trim());
}
