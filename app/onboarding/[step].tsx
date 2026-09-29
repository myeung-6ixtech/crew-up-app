import { Redirect, useLocalSearchParams } from 'expo-router';
import { isProfileStep } from '@crewup/shared';
import { SCREENS } from '@/constants/screens';
import { NotifyOptInScreen } from '@/features/onboarding/endings/beta/NotifyOptInScreen';
import { FROM_REVIEW_PARAM } from '@/features/onboarding/navigation';
import { STEP_COMPONENTS } from '@/features/onboarding/steps';

export default function OnboardingStepRoute() {
  const { step, from } = useLocalSearchParams<{ step: string; from?: string }>();

  if (step === 'beta_notify') return <NotifyOptInScreen />;
  if (!step || !isProfileStep(step)) return <Redirect href={SCREENS.onboarding.step('name_handle')} />;

  const StepComponent = STEP_COMPONENTS[step];
  return <StepComponent context={from === FROM_REVIEW_PARAM && step !== 'review' ? 'review' : 'flow'} />;
}
