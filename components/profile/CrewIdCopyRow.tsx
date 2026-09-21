import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/ui';
import { copyToClipboard } from '@/lib/clipboard';
import { formatFriendId } from '@/lib/friendId';
import { useThemedStyles, useTheme } from '@/theme';

type CrewIdCopyRowProps = {
  friendId: string | null | undefined;
  compact?: boolean;
};

export function CrewIdCopyRow({ friendId, compact = false }: CrewIdCopyRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.xs,
      marginTop: compact ? t.spacing.xs : t.spacing.sm,
      maxWidth: '100%',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xs,
      maxWidth: '100%',
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 6,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      backgroundColor: t.colors.bgSurface,
    },
    label: {
      ...t.typography.bodySm,
      color: t.colors.textSecondary,
    },
    pillLabel: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
    },
    code: {
      ...t.typography.bodySm,
      color: t.colors.textPrimary,
      fontFamily: t.typography.bodyStrong.fontFamily,
      letterSpacing: 0.6,
    },
    pillCode: {
      ...t.typography.caption,
      color: t.colors.textPrimary,
      fontFamily: t.typography.bodyStrong.fontFamily,
      letterSpacing: 0.5,
      flexShrink: 1,
    },
    copyButton: {
      minWidth: 32,
      minHeight: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.pill,
    },
    copyButtonCompact: {
      minWidth: 24,
      minHeight: 24,
      marginLeft: 2,
    },
  }));

  const displayCode = friendId ? formatFriendId(friendId) : '—';

  const onCopy = useCallback(async () => {
    if (!friendId) return;
    await copyToClipboard(formatFriendId(friendId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [friendId]);

  if (!friendId) return null;

  return (
    <View style={styles.row}>
      {compact ? (
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>{t('friends.crewId')}:</Text>
          <Text style={styles.pillCode} numberOfLines={1}>
            {displayCode}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copied ? t('friends.copiedCrewId') : t('friends.copyCrewId')}
            onPress={() => void onCopy()}
            style={({ pressed }) => [
              styles.copyButton,
              styles.copyButtonCompact,
              { opacity: pressed ? 0.72 : 1 },
            ]}>
            <AppIcon
              name="copy"
              size={15}
              color={copied ? theme.colors.accent : theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.label}>{t('friends.crewId')}:</Text>
          <Text style={styles.code} numberOfLines={1}>
            {displayCode}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copied ? t('friends.copiedCrewId') : t('friends.copyCrewId')}
            onPress={() => void onCopy()}
            style={({ pressed }) => [styles.copyButton, { opacity: pressed ? 0.72 : 1 }]}>
            <AppIcon
              name="copy"
              size={18}
              color={copied ? theme.colors.accent : theme.colors.textSecondary}
            />
          </Pressable>
        </>
      )}
    </View>
  );
}
