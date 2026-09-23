import { useCallback, useState } from 'react';
import { Platform, Pressable, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BodyText, Card, SectionLabel } from '@/components/ui';
import { copyToClipboard } from '@/lib/clipboard';
import { formatFriendId } from '@/lib/friendId';
import { useThemedStyles } from '@/theme';

type CrewIdCardProps = {
  friendId: string | null | undefined;
};

export function CrewIdCard({ friendId }: CrewIdCardProps) {
  const { t } = useTranslation();
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
      gap: theme.spacing.sm,
    },
    action: {
      minHeight: 36,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.cta,
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
    actionLabel: {
      ...theme.typography.bodySm,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.bodyStrong.fontFamily,
    },
    actionLabelPrimary: {
      color: theme.colors.onFill,
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
              disabled={!friendId}
              onPress={() => void onCopy()}
              style={styles.action}>
              <Text style={styles.actionLabel}>
                {copied ? t('friends.copiedCrewId') : t('friends.copyCrewId')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!friendId}
              onPress={() => void onShare()}
              style={[styles.action, styles.actionPrimary]}>
              <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>
                {t('friends.shareCrewId')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Card>
    </View>
  );
}
