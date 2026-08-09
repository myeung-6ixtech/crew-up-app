import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppIcon, Avatar, Badge, BodyText, Card, DisplaySmText } from '@/components/ui';
import { useThemedStyles, useTheme } from '@/theme';
import { SCREENS } from '@/constants/screens';
import type { Profile } from '@/types/domain';

export function ProfileSummaryCard({
  profile,
  isVerified,
}: {
  profile: Profile | null;
  isVerified: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md },
    headerCopy: { flex: 1 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginTop: t.spacing.sm },
    editButton: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.bgSurfaceRaised,
    },
    metaRow: { marginTop: t.spacing.md, gap: t.spacing.xs },
  }));

  const subtitle =
    [profile?.role_type, profile?.base_airport].filter(Boolean).join(' · ') ||
    'Complete your profile';

  return (
    <Card>
      <View style={styles.headerRow}>
        <Avatar name={profile?.display_name} fileId={profile?.avatar_file_id} size="md" />
        <View style={styles.headerCopy}>
          <DisplaySmText>{profile?.display_name ?? 'Your profile'}</DisplaySmText>
          <BodyText muted>{subtitle}</BodyText>
          <View style={styles.badgeRow}>
            <AppIcon
              name={isVerified ? 'verified' : 'pending'}
              size={16}
              color={isVerified ? theme.colors.statusVerified : theme.colors.textTertiary}
            />
            {isVerified ? (
              <Badge label={t('verification.verified')} tone="verified" />
            ) : (
              <Badge label={t('verification.pending')} tone="status" />
            )}
          </View>
        </View>
        <Pressable
          onPress={() => router.push(SCREENS.profile.edit)}
          style={styles.editButton}
          accessibilityLabel="Edit profile">
          <AppIcon name="edit" size={20} color={theme.colors.accent} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <BodyText muted>Visibility: {profile?.default_visibility ?? 'friends'}</BodyText>
        <BodyText muted>Notifications: {profile?.notification_mode ?? 'realtime'}</BodyText>
      </View>
    </Card>
  );
}
