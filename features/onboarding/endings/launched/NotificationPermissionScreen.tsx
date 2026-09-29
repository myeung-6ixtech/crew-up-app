import { useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SCREENS } from '@/constants/screens';
import { useSession } from '@/hooks/useSession';
import { registerForPushNotifications } from '@/services/notificationService';
import { StepScaffold } from '../../components/StepScaffold';
import { completeOnboarding, OnboardingRequestError } from '../../services/onboardingService';

const RECOVERY_ROUTES: Record<string, Href> = {
  ONBOARDING_PROFILE_INCOMPLETE: SCREENS.onboarding.step('review'),
  ONBOARDING_GUIDELINES_REQUIRED: SCREENS.onboarding.guidelines,
  ONBOARDING_GUIDELINES_OUTDATED: SCREENS.onboarding.guidelines,
};

/** Launch ending 3: push permission, then POST /onboarding/complete (write-once) → main app. */
export function NotificationPermissionScreen() {
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
      await completeOnboarding();
      // No back-navigation into onboarding once complete.
      if (router.canDismiss()) router.dismissAll();
      router.replace(SCREENS.onboarding.rosterIntro);
      await refreshProfile();
    } catch (e) {
      const recovery = e instanceof OnboardingRequestError ? RECOVERY_ROUTES[e.code] : undefined;
      if (recovery) {
        router.replace(recovery);
        return;
      }
      setError(e instanceof OnboardingRequestError ? e.message : t('onboarding.genericError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepScaffold
      step="launch_notifications"
      context="flow"
      title={t('onboarding.notifications.title')}
      subtitle={t('onboarding.notifications.subtitle')}
      primaryLabel={t('onboarding.notifications.enable')}
      onPrimary={() => void finish(true)}
      primaryLoading={saving}
      secondaryLabel={t('onboarding.notifications.notNow')}
      onSecondary={() => void finish(false)}
      error={error}>
      {null}
    </StepScaffold>
  );
}
