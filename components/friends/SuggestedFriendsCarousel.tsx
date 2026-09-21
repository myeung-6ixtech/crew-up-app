import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ApolloClient } from '@apollo/client';
import { Avatar, BodyText, SectionLabel } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { formatOptionLabel } from '@/lib/formatOptionLabel';
import { requestConnection, type SuggestedProfile } from '@/services/connectionService';
import { useThemedStyles } from '@/theme';

type SuggestedFriendsCarouselProps = {
  profiles: SuggestedProfile[];
  client: ApolloClient;
  onRequestSent?: (userId: string) => void;
};

export function SuggestedFriendsCarousel({
  profiles,
  client,
  onRequestSent,
}: SuggestedFriendsCarouselProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  const styles = useThemedStyles((theme) => ({
    section: { marginBottom: theme.spacing.xl },
    scroll: {
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    card: {
      width: 132,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    name: {
      ...theme.typography.bodyStrong,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    meta: {
      textAlign: 'center',
      minHeight: 16,
    },
    action: {
      width: '100%',
      minHeight: 34,
      borderRadius: theme.radius.cta,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.accent,
    },
    actionSecondary: {
      backgroundColor: theme.colors.bgSurfaceRaised,
      borderWidth: 1,
      borderColor: theme.colors.hairline,
    },
    actionPressed: {
      opacity: 0.82,
    },
    actionDisabled: {
      opacity: 0.55,
    },
    actionLabel: {
      ...theme.typography.bodySm,
      color: theme.colors.textInverse,
      fontFamily: theme.typography.bodyStrong.fontFamily,
    },
    actionLabelSecondary: {
      color: theme.colors.textSecondary,
    },
  }));

  if (!profiles.length) return null;

  const onSendRequest = async (profile: SuggestedProfile) => {
    if (requestedIds.has(profile.user_id) || sendingId) return;
    setSendingId(profile.user_id);
    try {
      await requestConnection(client, profile.user_id, t('friends.sendRequestMessage'));
      setRequestedIds((current) => new Set(current).add(profile.user_id));
      onRequestSent?.(profile.user_id);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <View style={styles.section}>
      <SectionLabel>{t('friends.suggested')}</SectionLabel>
      <BodyText muted style={{ marginBottom: 4 }}>{t('friends.suggestedHint')}</BodyText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {profiles.map((profile) => {
          const sent = requestedIds.has(profile.user_id);
          const sending = sendingId === profile.user_id;
          const caption = [profile.role_type ? formatOptionLabel(profile.role_type) : null, profile.base_airport]
            .filter(Boolean)
            .join(' · ');

          return (
            <View key={profile.user_id} style={styles.card}>
              <Pressable onPress={() => router.push(SCREENS.network.user(profile.user_id))}>
                <Avatar name={profile.display_name} fileId={profile.avatar_file_id} size="lg" />
              </Pressable>
              <Pressable onPress={() => router.push(SCREENS.network.user(profile.user_id))}>
                <Text style={styles.name} numberOfLines={1}>
                  {profile.display_name}
                </Text>
              </Pressable>
              <BodyText muted style={styles.meta} numberOfLines={1}>
                {caption || ' '}
              </BodyText>
              <Pressable
                accessibilityRole="button"
                disabled={sent || sending}
                onPress={() => void onSendRequest(profile)}
                style={({ pressed }) => [
                  styles.action,
                  sent ? styles.actionSecondary : null,
                  (sent || sending) && styles.actionDisabled,
                  pressed && !sent && !sending ? styles.actionPressed : null,
                ]}>
                <Text style={[styles.actionLabel, sent ? styles.actionLabelSecondary : null]}>
                  {sent ? t('friends.requestSent') : t('friends.sendRequest')}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
