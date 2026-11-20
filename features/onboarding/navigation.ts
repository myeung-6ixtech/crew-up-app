import type { Href } from 'expo-router';
import { isLaunchStep, previousStep, type AppMode, type OnboardingStep } from '@crewup/shared';
import { SCREENS } from '@/constants/screens';

/**
 * Where a step form is rendered:
 * - `flow`: normal onboarding; saving advances `current_step` and moves to the next step
 * - `review`: opened from Review's "Edit"; saves without advancing and returns to Review
 * - `edit`: Settings → Edit profile; saves without advancing and never touches onboarding state
 */
export type StepContext = 'flow' | 'review' | 'edit';

export const FROM_REVIEW_PARAM = 'review';
/** Opened by Back from the next step: a step with sub-screens starts on its last one. */
export const FROM_BACK_PARAM = 'back';

/** Steps that, in the flow, only save and move on (Photo is collected on the Name screen). Back skips them. */
const PASS_THROUGH_STEPS: readonly OnboardingStep[] = ['photo'];

/** The step Back goes to in the flow, skipping pass-through steps (otherwise Back from Review lands on Photo, which sends you straight back to Review). */
export function flowPreviousStep(mode: AppMode, step: OnboardingStep): OnboardingStep | null {
  let previous = previousStep(mode, step);
  while (previous && PASS_THROUGH_STEPS.includes(previous)) previous = previousStep(mode, previous);
  return previous;
}

/** Where Back goes: the previous step, opened on its last sub-screen. */
export function backHref(step: OnboardingStep): Href {
  return `${String(onboardingHref(step))}?from=${FROM_BACK_PARAM}` as Href;
}

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
