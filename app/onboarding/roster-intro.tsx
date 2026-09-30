import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Subtitle, Button } from '@/components/ui';
import { SCREENS } from '@/constants/screens';

export default function RosterIntroScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <Title style={{ marginBottom: 20 }}>{t('onboarding.rosterIntro.title')}</Title>
      <Subtitle>{t('onboarding.rosterIntro.subtitle')}</Subtitle>
      <Button label={t('roster.upload')} onPress={() => router.push(SCREENS.roster.upload)} />
      <Button label={t('roster.manual')} onPress={() => router.push(SCREENS.roster.confirm)} variant="secondary" />
      <Button
        label={t('onboarding.rosterIntro.later')}
        onPress={() => router.replace(SCREENS.tabs.home)}
        variant="secondary"
      />
    </Screen>
  );
}
