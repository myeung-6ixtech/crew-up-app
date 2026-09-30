import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { ProfilePills } from '@/components/profile/ProfilePills';
import { Screen, Title, Button, Badge, SectionLabel } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchPublicProfile, requestConnection } from '@/services/connectionService';
import { fetchActivityPreferences } from '@/services/activityService';
import { formatFriendId } from '@/lib/friendId';
import { ensureDirectThread } from '@/services/messagingService';
import { ReportSheet } from '@/components/ReportSheet';
import { reportAndBlock, reportUser } from '@/services/safetyService';
import { SCREENS } from '@/constants/screens';

export default function PublicProfileScreen() {
  const { userId: paramUserId } = useLocalSearchParams<{ userId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [profile, setProfile] = useState<{
    user_id: string;
    display_name: string;
    role_type?: string;
    base_airport?: string;
    is_verified?: boolean;
    rank?: string;
    show_rank?: boolean;
    friend_id?: string | null;
  } | null>(null);
  const [activityNames, setActivityNames] = useState<string[]>([]);
  const [interestNames, setInterestNames] = useState<string[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    if (!paramUserId) return;
    const [nextProfile, preferences] = await Promise.all([
      fetchPublicProfile(client, paramUserId),
      fetchActivityPreferences(client, paramUserId).catch(() => []),
    ]);
    setProfile(nextProfile);
    setActivityNames(preferences.filter((item) => item.kind === 'activity').map((item) => item.name));
    setInterestNames(preferences.filter((item) => item.kind === 'interest').map((item) => item.name));
  }, [client, paramUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!profile) return <Screen><Text>{t('common.loading')}</Text></Screen>;

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{profile.display_name}</Title>
        <Text>{[profile.role_type, profile.base_airport].filter(Boolean).join(' · ')}</Text>
        {profile.friend_id ? (
          <Text>{t('friends.crewId')}: {formatFriendId(profile.friend_id)}</Text>
        ) : null}
        {profile.is_verified ? <Badge label="Verified" tone="verified" /> : null}
        {profile.show_rank && profile.rank ? <Text>Rank: {profile.rank}</Text> : null}
        {activityNames.length ? (
          <View>
            <SectionLabel>{t('onboarding.review.activitiesSection')}</SectionLabel>
            <ProfilePills names={activityNames} />
          </View>
        ) : null}
        {interestNames.length ? (
          <View>
            <SectionLabel>{t('onboarding.review.interestsSection')}</SectionLabel>
            <ProfilePills names={interestNames} />
          </View>
        ) : null}
        <Button label={t('network.connect')} onPress={() => requestConnection(client, profile.user_id)} />
        <Button
          label="Message"
          variant="secondary"
          onPress={async () => {
            if (!userId) return;
            const threadId = await ensureDirectThread(client, userId, profile.user_id);
            router.push(SCREENS.messages.thread(threadId));
          }}
        />
        <Button label={t('safety.report')} variant="secondary" onPress={() => setReportOpen(true)} />
        <Button
          label={t('safety.block')}
          variant="destructive"
          onPress={async () => {
            await reportAndBlock(client, profile.user_id, 'blocked_from_profile');
            router.back();
          }}
        />
      </ScrollView>
      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, details) => {
          await reportUser(client, { reason, details, reportedUserId: profile.user_id });
        }}
      />
    </Screen>
  );
}
