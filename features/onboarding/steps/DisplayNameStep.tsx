import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NameHandleSchema } from '@crewup/shared';
import { HeadlineText, PillSelectorGroup } from '@/components/ui';
import { hapticError } from '@/lib/haptics';
import { useAuth } from '@/hooks/useSession';
import { useTheme } from '@/theme';
import { StepScaffold } from '../components/StepScaffold';
import { displayNameSample, displayStyleFromSaved, splitFullName, type DisplayNameStyle } from '../displayName';
import { useStepSave } from '../hooks/useStepForm';

const STYLE_LABELS: Record<DisplayNameStyle, string> = {
  full: 'onboarding.nameHandle.displayFull',
  initial: 'onboarding.nameHandle.displayInitial',
  last: 'onboarding.nameHandle.displayLast',
};

/** Edit profile: choose the name other crew see, without changing the legal name. */
export function DisplayNameStep() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { profile } = useAuth();
  const { save, saving, formError } = useStepSave('name_handle', 'edit');
  const saved = splitFullName(profile?.full_name ?? '');
  const [style, setStyle] = useState<DisplayNameStyle>(() =>
    displayStyleFromSaved(saved.firstName, saved.lastName, profile?.preferred_name),
  );
  const [error, setError] = useState('');
  const samples = useMemo(
    () => ({
      full: displayNameSample(saved.firstName, saved.lastName, 'full'),
      initial: displayNameSample(saved.firstName, saved.lastName, 'initial'),
      last: displayNameSample(saved.firstName, saved.lastName, 'last'),
    }),
    [saved.firstName, saved.lastName],
  );

  const onSave = async () => {
    const preferredName = samples[style];
    const parsed = NameHandleSchema.safeParse({
      fullName: samples.full,
      fullNameNative: profile?.full_name_native || null,
      preferredName: preferredName || null,
      username: profile?.username ?? '',
    });
    if (!parsed.success) {
      hapticError();
      setError(parsed.error.issues[0]?.message ?? t('onboarding.genericError'));
      return;
    }
    setError('');
    await save(parsed.data);
  };

  return (
    <StepScaffold
      context="edit"
      title={t('onboarding.nameHandle.displayPrompt')}
      primaryLabel={t('onboarding.save')}
      onPrimary={() => void onSave()}
      primaryLoading={saving}
      error={formError || error}>
      <HeadlineText style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>{samples[style]}</HeadlineText>
      <PillSelectorGroup
        tone="fill"
        value={style}
        onChange={setStyle}
        options={(['full', 'initial', 'last'] as const).map((option) => ({
          value: option,
          label: samples[option] || t('onboarding.nameHandle.displayEmpty'),
          accessibilityLabel: t(STYLE_LABELS[option]),
        }))}
      />
    </StepScaffold>
  );
}
