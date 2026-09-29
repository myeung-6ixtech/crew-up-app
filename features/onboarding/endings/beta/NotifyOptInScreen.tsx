import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SCREENS } from '@/constants/screens';
import { useSession } from '@/hooks/useSession';
import { registerForPushNotifications } from '@/services/notificationService';
import { StepScaffold } from '../../components/StepScaffold';
import { completeBetaSignup, OnboardingRequestError } from '../../services/onboardingService';

/** Beta ending 1: optional push opt-in, then POST /onboarding/beta-complete → holding screen. */
export function NotifyOptInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshProfile } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const finish = async (requestPermission: boolean) => {
    setSaving(true);
    setError('');
    try {
      if (requestPermission) await registerForPushNotifications();
      await completeBetaSignup();
      await refreshProfile();
      router.replace(SCREENS.onboarding.betaHolding);
    } catch (e) {
      if (e instanceof OnboardingRequestError && e.code === 'ONBOARDING_PROFILE_INCOMPLETE') {
        router.replace(SCREENS.onboarding.step('review'));
        return;
      }
      setError(e instanceof OnboardingRequestError ? e.message : t('onboarding.genericError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepScaffold
      step="beta_notify"
      context="flow"
      title={t('onboarding.betaNotify.title')}
      subtitle={t('onboarding.betaNotify.subtitle')}
      primaryLabel={t('onboarding.betaNotify.enable')}
      onPrimary={() => void finish(true)}
      primaryLoading={saving}
      secondaryLabel={t('onboarding.betaNotify.skip')}
      onSecondary={() => void finish(false)}
      error={error}>
      {null}
    </StepScaffold>
  );
}
