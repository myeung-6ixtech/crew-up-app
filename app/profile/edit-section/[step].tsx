import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SCREENS } from '@/constants/screens';
import { DisplayNameStep } from '@/features/onboarding/steps/DisplayNameStep';
import { InterestsStep } from '@/features/onboarding/steps/InterestsStep';
import { LanguagesStep } from '@/features/onboarding/steps/LanguagesStep';
import { EDITABLE_STEPS, STEP_COMPONENTS, type EditableStep } from '@/features/onboarding/steps';

function isEditableStep(value: string | undefined): value is EditableStep {
  return (EDITABLE_STEPS as readonly string[]).includes(value ?? '');
}

const SECTION_TITLE_KEYS: Record<EditableStep, string> = {
  name_handle: 'onboarding.review.sections.nameHandle',
  about: 'onboarding.review.sections.about',
  residence: 'onboarding.review.placesSection',
  crew: 'onboarding.review.sections.crew',
  phone: 'onboarding.review.sections.phone',
};

export default function EditProfileSectionRoute() {
  const { t } = useTranslation();
  const { step } = useLocalSearchParams<{ step: string }>();
  if (step === 'display') {
    return (
      <>
        <Stack.Screen options={{ title: t('onboarding.nameHandle.displayPrompt') }} />
        <DisplayNameStep />
      </>
    );
  }
  if (step === 'languages') {
    return (
      <>
        <Stack.Screen options={{ title: t('onboarding.about.languages') }} />
        <LanguagesStep />
      </>
    );
  }
  if (step === 'interests') {
    return (
      <>
        <Stack.Screen options={{ title: t('onboarding.about.intoTitle') }} />
        <InterestsStep />
      </>
    );
  }
  if (!isEditableStep(step)) return <Redirect href={SCREENS.profile.edit} />;

  const StepComponent = STEP_COMPONENTS[step];
  return (
    <>
      <Stack.Screen options={{ title: t(SECTION_TITLE_KEYS[step]) }} />
      <StepComponent context="edit" />
    </>
  );
}
