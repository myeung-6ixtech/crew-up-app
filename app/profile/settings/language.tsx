import { Text } from 'react-native';
import { Screen, Title, Subtitle } from '@/components/ui';

export default function LanguageSettingsScreen() {
  return (
    <Screen>
      <Title>Language</Title>
      <Subtitle>English is the only supported language in MVP v1. i18n keys are ready for future locales.</Subtitle>
      <Text>Current: English</Text>
    </Screen>
  );
}
