import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/hooks/useSession';
import { StepScaffold } from '../components/StepScaffold';
import { useOnboardingState } from '../hooks/useOnboardingState';

/** Shown when app-config or onboarding state can't be loaded and nothing is cached. */
export function ModeUnavailableScreen() {
  const { t } = useTranslation();
  const { signOut } = useSession();
  const { retryMode, refresh } = useOnboardingState();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await Promise.all([retryMode(), refresh()]);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <StepScaffold
      context="flow"
      hideBack
      title={t('onboarding.unavailable.title')}
      subtitle={t('onboarding.unavailable.subtitle')}
      primaryLabel={t('onboarding.unavailable.retry')}
      onPrimary={() => void retry()}
      primaryLoading={retrying}
      secondaryLabel={t('onboarding.signOut')}
      onSecondary={() => void signOut()}>
      {null}
    </StepScaffold>
  );
}
