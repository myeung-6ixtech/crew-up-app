import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabHeaderIconButton } from '@/components/navigation/TabHeaderIconButton';
import { SCREENS } from '@/constants/screens';

export function FriendsAddHeaderButton() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <TabHeaderIconButton
      icon="userPlus"
      accessibilityLabel={t('friends.addFriend')}
      onPress={() => router.push(SCREENS.friends.add)}
    />
  );
}
