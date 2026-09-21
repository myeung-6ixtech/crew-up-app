import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, BodyText, Button } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { formatOptionLabel } from '@/lib/formatOptionLabel';
import { useThemedStyles } from '@/theme';

type FriendUserRowProps = {
  userId: string;
  displayName: string;
  roleType?: string | null;
  baseAirport?: string | null;
  avatarFileId?: string | null;
  subtitle?: string | null;
  actionLabel?: string;
  actionLoading?: boolean;
  actionDisabled?: boolean;
  onAction?: () => void;
};

export function FriendUserRow({
  userId,
  displayName,
  roleType,
  baseAirport,
  avatarFileId,
  subtitle,
  actionLabel,
  actionLoading,
  actionDisabled,
  onAction,
}: FriendUserRowProps) {
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.md,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      backgroundColor: t.colors.bgSurface,
      marginBottom: t.spacing.sm,
    },
    meta: { flex: 1, gap: 2, minWidth: 0 },
    name: {
      ...t.typography.bodyStrong,
      color: t.colors.textPrimary,
    },
    actionWrap: { minWidth: 96 },
  }));

  const caption =
    subtitle ??
    [roleType ? formatOptionLabel(roleType) : null, baseAirport].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push(SCREENS.network.user(userId))}>
        <Avatar name={displayName} fileId={avatarFileId} size="md" />
      </Pressable>
      <Pressable style={styles.meta} onPress={() => router.push(SCREENS.network.user(userId))}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {caption ? <BodyText muted numberOfLines={1}>{caption}</BodyText> : null}
      </Pressable>
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <Button
            label={actionLabel}
            onPress={onAction}
            loading={actionLoading}
            disabled={actionDisabled}
            noTopMargin
          />
        </View>
      ) : null}
    </View>
  );
}
