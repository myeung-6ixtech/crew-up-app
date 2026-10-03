import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AboutPatchSchema, AboutSchema, LANGUAGE_CODES } from '@crewup/shared';
import { z } from 'zod';
import { SCREENS } from '@/constants/screens';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useAuth, useSession } from '@/hooks/useSession';
import { LanguagePills } from '../components/LanguagePills';
import { StepScaffold } from '../components/StepScaffold';
import { OnboardingRequestError, saveStep } from '../services/onboardingService';

const LanguagesSchema = z.object({
  languages: z
    .array(z.string().refine((code) => LANGUAGE_CODES.has(code), 'Unsupported language'))
    .min(1, 'Choose at least one language')
    .max(10, 'Choose up to 10 languages'),
});

const OTHER_ABOUT_FIELDS = new Set([
  'dateOfBirth',
  'homeCountryCode',
  'hometownCity',
  'hometownLatitude',
  'hometownLongitude',
]);

function knownLanguages(codes: string[] | null | undefined): string[] {
  return (codes ?? []).filter((code) => LANGUAGE_CODES.has(code));
}

function errorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof OnboardingRequestError)) return fallback;
  return Object.values(error.fields)[0] || error.message || fallback;
}

/** Edit profile: languages only. Date of birth and hometown stay as they are. */
export function LanguagesStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const { refreshProfile } = useSession();
  const [draft, setDraft] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const languages = draft ?? knownLanguages(profile?.languages);

  const returnToEditProfile = () => {
    if (router.canGoBack()) router.back();
    else router.replace(SCREENS.profile.edit);
  };

  const onSave = async () => {
    const parsed = LanguagesSchema.safeParse({ languages });
    if (!parsed.success) {
      hapticError();
      setError(parsed.error.issues[0]?.message ?? t('onboarding.genericError'));
      return;
    }

    const selected = parsed.data.languages;
    const patch = AboutPatchSchema.safeParse({ languages: selected });
    if (!patch.success) {
      hapticError();
      setError(patch.error.issues[0]?.message ?? t('onboarding.genericError'));
      return;
    }

    const storedAbout = AboutSchema.safeParse({
      dateOfBirth: profile?.own_date_of_birth ?? '',
      homeCountryCode: profile?.home_country_code ?? '',
      hometownCity: profile?.hometown_city ?? null,
      hometownLatitude: profile?.own_hometown_latitude ?? null,
      hometownLongitude: profile?.own_hometown_longitude ?? null,
      languages: selected,
    });

    setSaving(true);
    setError('');
    try {
      try {
        await saveStep('about', patch.data, { advance: false });
      } catch (saveError) {
        const fields = saveError instanceof OnboardingRequestError ? saveError.fields : {};
        const languageProblem = Object.keys(fields).some((field) => field === 'languages' || field.startsWith('languages.'));
        const rejectedBecauseOtherAboutFieldsMissing =
          saveError instanceof OnboardingRequestError &&
          storedAbout.success &&
          !languageProblem &&
          (saveError.status === 422 || Object.keys(fields).some((field) => OTHER_ABOUT_FIELDS.has(field)));
        if (!rejectedBecauseOtherAboutFieldsMissing) throw saveError;
        await saveStep('about', storedAbout.data, { advance: false });
      }
      await refreshProfile();
      hapticSuccess();
      returnToEditProfile();
    } catch (saveError) {
      hapticError();
      setError(errorMessage(saveError, t('onboarding.genericError')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepScaffold
      context="edit"
      title={t('onboarding.about.languages')}
      primaryLabel={t('onboarding.save')}
      onPrimary={() => void onSave()}
      primaryLoading={saving}
      error={error}>
      <LanguagePills value={languages} onChange={setDraft} />
    </StepScaffold>
  );
}
