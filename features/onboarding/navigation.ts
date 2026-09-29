import type { Href } from 'expo-router';
import { isLaunchStep, type OnboardingStep } from '@crewup/shared';
import { SCREENS } from '@/constants/screens';

/**
 * Where a step form is rendered:
 * - `flow`: normal onboarding; saving advances `current_step` and moves to the next step
 * - `review`: opened from Review's "Edit"; saves without advancing and returns to Review
 * - `edit`: Settings → Edit profile; saves without advancing and never touches onboarding state
 */
export type StepContext = 'flow' | 'review' | 'edit';

export const FROM_REVIEW_PARAM = 'review';

const LAUNCH_ROUTES = {
  launch_privacy: SCREENS.onboarding.privacy,
  launch_guidelines: SCREENS.onboarding.guidelines,
  launch_notifications: SCREENS.onboarding.notifications,
} as const;

export function onboardingHref(step: OnboardingStep): Href {
  return isLaunchStep(step) ? LAUNCH_ROUTES[step] : SCREENS.onboarding.step(step);
}

export function reviewEditHref(step: OnboardingStep): Href {
  return `${SCREENS.onboarding.step(step)}?from=${FROM_REVIEW_PARAM}` as Href;
}

/** Expo Router segment names under `app/onboarding/` that belong to the in-progress flow. */
export const FLOW_SEGMENTS = new Set([
  '[step]',
  'privacy',
  'guidelines',
  'notifications',
  'roster-intro',
  'house-rules',
]);
