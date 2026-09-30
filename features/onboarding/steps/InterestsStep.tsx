import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { hapticError } from '@/lib/haptics';
import { useAuth } from '@/hooks/useSession';
import { InterestsFields } from '../components/InterestsFields';
import { StepScaffold } from '../components/StepScaffold';
import { useActivitySelection } from '../hooks/useActivitySelection';

/** Edit profile: the same activities and interests screen, without advancing onboarding. */
export function InterestsStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const interests = useActivitySelection(userId);
  const [error, setError] = useState('');

  const onSave = async () => {
    setError('');
    try {
      await interests.save();
      router.back();
    } catch {
      hapticError();
      setError(t('onboarding.genericError'));
    }
  };

  return (
    <StepScaffold
      context="edit"
      title={t('onboarding.about.intoTitle')}
      primaryLabel={t('onboarding.save')}
      onPrimary={() => void onSave()}
      primaryLoading={interests.saving}
      primaryDisabled={interests.loading || interests.failed}
      error={error || (interests.failed ? t('onboarding.genericError') : '')}>
      <InterestsFields
        activities={interests.activities}
        selectedIds={interests.selectedIds}
        onToggle={interests.toggle}
        loading={interests.loading}
      />
    </StepScaffold>
  );
}
