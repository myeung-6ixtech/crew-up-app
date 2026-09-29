import { useTranslation } from 'react-i18next';
import { HeadlineText } from '@/components/ui';
import { useTheme } from '@/theme';
import { BulletList } from '../../components/BulletList';
import { StepScaffold } from '../../components/StepScaffold';
import { useStepSave } from '../../hooks/useStepForm';

/** Launch ending 1: privacy & presence explainer. */
export function PrivacyExplainerScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { save, saving, formError } = useStepSave('launch_privacy', 'flow');
  const points = t('onboarding.privacy.points', { returnObjects: true }) as string[];

  return (
    <StepScaffold
      step="launch_privacy"
      context="flow"
      title={t('onboarding.privacy.title')}
      primaryLabel={t('onboarding.privacy.cta')}
      onPrimary={() => void save({})}
      primaryLoading={saving}
      error={formError}>
      <HeadlineText style={{ marginBottom: theme.spacing.md }}>{t('onboarding.privacy.lead')}</HeadlineText>
      <BulletList items={points} />
    </StepScaffold>
  );
}
