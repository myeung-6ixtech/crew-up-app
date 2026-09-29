import { useCallback, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, BodyText, Card, SectionLabel } from '@/components/ui';
import { copyToClipboard } from '@/lib/clipboard';
import { formatFriendId } from '@/lib/friendId';
import { useTheme, useThemedStyles } from '@/theme';

type CrewIdCardProps = {
  friendId: string | null | undefined;
};

export function CrewIdCard({ friendId }: CrewIdCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const styles = useThemedStyles((theme) => ({
    card: { marginBottom: theme.spacing.lg, gap: theme.spacing.sm },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    code: {
      ...theme.typography.displaySm,
      color: theme.colors.textPrimary,
      letterSpacing: 1,
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    action: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.bgSurfaceRaised,
      borderWidth: 1,
      borderColor: theme.colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPrimary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
  }));

  const displayCode = friendId ? formatFriendId(friendId) : '—';

  const onCopy = useCallback(async () => {
    if (!friendId) return;
    await copyToClipboard(formatFriendId(friendId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [friendId]);

  const onShare = useCallback(async () => {
    if (!friendId) return;
    await Share.share({
      message: t('friends.shareCrewIdMessage', { crewId: formatFriendId(friendId) }),
    });
  }, [friendId, t]);

  return (
    <View style={styles.card}>
      <SectionLabel>{t('friends.crewId')}</SectionLabel>
      <BodyText muted>{t('friends.crewIdHint')}</BodyText>
      <Card>
        <View style={styles.codeRow}>
          <Text style={styles.code} selectable>
            {displayCode}
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copied ? t('friends.copiedCrewId') : t('friends.copyCrewId')}
              disabled={!friendId}
              onPress={() => void onCopy()}
              style={({ pressed }) => [styles.action, { opacity: pressed ? 0.72 : 1 }]}>
              <AppIcon
                name={copied ? 'check' : 'copy'}
                size={18}
                color={copied ? theme.colors.accentText : theme.colors.textSecondary}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('friends.shareCrewId')}
              disabled={!friendId}
              onPress={() => void onShare()}
              style={({ pressed }) => [
                styles.action,
                styles.actionPrimary,
                { opacity: pressed ? 0.72 : 1 },
              ]}>
              <AppIcon name="share" size={18} color={theme.colors.onFill} />
            </Pressable>
          </View>
        </View>
      </Card>
    </View>
  );
}
