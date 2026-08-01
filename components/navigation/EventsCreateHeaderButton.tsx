import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabHeaderIconButton } from '@/components/navigation/TabHeaderIconButton';
import { SCREENS } from '@/constants/screens';

/** Events tab header — create meetup. */
export function EventsCreateHeaderButton() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <TabHeaderIconButton
      icon="add"
      accessibilityLabel={t('events.create')}
      onPress={() => router.push(SCREENS.events.create)}
    />
  );
}
