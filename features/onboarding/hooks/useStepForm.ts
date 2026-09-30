import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nextStep, type OnboardingStep, type STEP_SCHEMAS, type StepData, type StepInput } from '@crewup/shared';
import { useAppMode } from '@/hooks/useAppMode';
import { useSession } from '@/hooks/useSession';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { onboardingHref, type StepContext } from '../navigation';
import { OnboardingRequestError, saveStep } from '../services/onboardingService';

/** After a successful save: next step (flow), back to Review (review), or back to Edit profile (edit). */
export function useStepNavigation(step: OnboardingStep, context: StepContext) {
  const router = useRouter();
  const { mode } = useAppMode();

  return useCallback(() => {
    if (context === 'flow') {
      const next = mode ? nextStep(mode, step) : null;
      if (next) router.push(onboardingHref(next));
      return;
    }
    if (router.canGoBack()) router.back();
    else if (context === 'review') router.replace(onboardingHref('review'));
  }, [context, mode, router, step]);
}

/** Saves one step through PUT /onboarding/step, maps server field errors, refreshes session state. */
export function useStepSave<S extends OnboardingStep>(step: S, context: StepContext) {
  const { t } = useTranslation();
  const { refreshProfile } = useSession();
  const navigate = useStepNavigation(step, context);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const save = useCallback(
    async (
      data: Record<string, unknown>,
      onFieldError?: (field: string, message: string) => void,
    ): Promise<boolean> => {
      setSaving(true);
      setFormError('');
      try {
        await saveStep(step, data, { advance: context === 'flow' });
        await refreshProfile();
        hapticSuccess();
        navigate();
        return true;
      } catch (error) {
        hapticError();
        if (error instanceof OnboardingRequestError) {
          const fields = Object.entries(error.fields);
          fields.forEach(([field, message]) => onFieldError?.(field, message));
          if (!fields.length || !onFieldError) setFormError(error.message);
        } else {
          setFormError(t('onboarding.genericError'));
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    [context, navigate, refreshProfile, step, t],
  );

  return { save, saving, formError, setFormError };
}

type SchemaStep = Exclude<keyof typeof STEP_SCHEMAS, 'review' | 'beta_notify' | 'launch_privacy' | 'launch_guidelines' | 'launch_notifications'>;

/** React Hook Form bound to the step's shared Zod schema (same rules the Function enforces). */
export function useStepForm<S extends SchemaStep>(
  step: S,
  schema: (typeof STEP_SCHEMAS)[S],
  defaultValues: DefaultValues<StepInput<S> & FieldValues>,
  context: StepContext,
) {
  const form = useForm<StepInput<S> & FieldValues, unknown, StepData<S> & FieldValues>({
    // zodResolver's overloads can't be narrowed through the indexed schema type.
    resolver: zodResolver(schema as never),
    defaultValues,
    mode: 'onTouched',
  });
  const { save, saving, formError } = useStepSave(step, context);

  const submit = form.handleSubmit(async (data) => {
    await save(data as Record<string, unknown>, (field, message) =>
      form.setError(field as Path<StepInput<S> & FieldValues>, { message }),
    );
  });

  return { form, submit, save, saving, formError };
}
