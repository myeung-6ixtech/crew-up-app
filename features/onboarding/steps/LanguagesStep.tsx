import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AboutSchema, LANGUAGE_CODES } from '@crewup/shared';
import { z } from 'zod';
import { hapticError } from '@/lib/haptics';
import { useAuth } from '@/hooks/useSession';
import { LanguagePills } from '../components/LanguagePills';
import { StepScaffold } from '../components/StepScaffold';
import { useStepSave } from '../hooks/useStepForm';

const LanguagesSchema = z.object({
  languages: z
    .array(z.string().refine((code) => LANGUAGE_CODES.has(code), 'Unsupported language'))
    .min(1, 'Choose at least one language')
    .max(10, 'Choose up to 10 languages'),
});

/** Edit profile: languages only. Date of birth and hometown stay as they are. */
export function LanguagesStep() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { save, saving, formError } = useStepSave('about', 'edit');
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? []);
  const [error, setError] = useState('');

  const onSave = async () => {
    const parsed = LanguagesSchema.safeParse({ languages });
    if (!parsed.success) {
      hapticError();
      setError(parsed.error.issues[0]?.message ?? t('onboarding.genericError'));
      return;
    }
    const about = AboutSchema.safeParse({
      dateOfBirth: profile?.own_date_of_birth ?? '',
      languages: parsed.data.languages,
      homeCountryCode: profile?.home_country_code ?? '',
      hometownCity: profile?.hometown_city ?? null,
      hometownLatitude: profile?.own_hometown_latitude ?? null,
      hometownLongitude: profile?.own_hometown_longitude ?? null,
    });
    if (!about.success) {
      hapticError();
      setError(about.error.issues[0]?.message ?? t('onboarding.genericError'));
      return;
    }
    setError('');
    await save(about.data);
  };

  return (
    <StepScaffold
      context="edit"
      title={t('onboarding.about.languages')}
      primaryLabel={t('onboarding.save')}
      onPrimary={() => void onSave()}
      primaryLoading={saving}
      error={formError || error}>
      <LanguagePills value={languages} onChange={setLanguages} />
    </StepScaffold>
  );
}
