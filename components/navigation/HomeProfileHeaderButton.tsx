import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { useAuth } from '@/hooks/useSession';
import { useThemedStyles } from '@/theme';

/** Home tab header — avatar button that opens edit profile. */
export function HomeProfileHeaderButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const styles = useThemedStyles((t) => ({
    hit: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.sm,
    },
  }));

  return (
    <Pressable
      onPress={() => router.push(SCREENS.profile.edit)}
      accessibilityRole="button"
      accessibilityLabel={t('home.editProfile')}
      style={({ pressed }) => [styles.hit, { opacity: pressed ? 0.72 : 1 }]}>
      <Avatar name={profile?.display_name} size="sm" />
    </Pressable>
  );
}
