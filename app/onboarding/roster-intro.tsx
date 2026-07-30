import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Subtitle, Button } from '@/components/ui';
import { SCREENS } from '@/constants/screens';

export default function RosterIntroScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <Title>Your schedule powers matching</Title>
      <Subtitle>
        Upload a roster screenshot or enter layovers manually. CrewUp uses coarse city windows only — never your full roster with others.
      </Subtitle>
      <Button label={t('roster.upload')} onPress={() => router.push(SCREENS.roster.upload)} />
      <Button label={t('roster.manual')} onPress={() => router.push(SCREENS.roster.confirm)} variant="secondary" />
      <Button label="Later" onPress={() => router.replace(SCREENS.tabs.home)} variant="secondary" />
    </Screen>
  );
}
