import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { CrewAvatar, TabTitle } from '@/components/crew/kit';
import { personName, type PersonProfile } from '@/components/crew/people';
import { SafetyNudgeModal } from '@/components/SafetyNudgeModal';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { useAuth } from '@/hooks/useSession';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useApolloClient } from '@/lib/apolloHooks';
import { fetchThreads } from '@/services/messagingService';
import { useSafetyStore } from '@/stores/safetyStore';
import { fontFamily, useTheme } from '@/theme';

type ThreadRow = {
  id: string;
  thread_id: string;
  thread: {
    type: string;
    updated_at?: string;
    event?: { title?: string | null } | null;
    messages?: { body?: string | null; created_at?: string }[];
    participants?: { user_id: string; user?: { profile?: PersonProfile } }[];
  };
};

function EventGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M6.5 3h11A2.5 2.5 0 0120 5.5v8a2.5 2.5 0 01-2.5 2.5H11l-5 4.5V16A2.5 2.5 0 014 13.5v-8A2.5 2.5 0 016.5 3z" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

/** One card per thread: who (or which meet), then the latest line. Event chats share the inbox. */
export default function MessagesTab() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const { nudgeVisible, checkNudge, dismissNudge } = useSafetyStore();
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const tabScroll = useTabBarScroll({ contentContainerStyle: { paddingHorizontal: 24 } });

  const load = useCallback(async () => {
    if (!userId) return;
    const rows: ThreadRow[] = await fetchThreads(client, userId);
    const latest = (row: ThreadRow) => row.thread.messages?.[0]?.created_at ?? row.thread.updated_at ?? '';
    setThreads(rows.slice().sort((a, b) => (latest(a) < latest(b) ? 1 : -1)));
    void checkNudge();
  }, [client, userId, checkNudge]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const other = (row: ThreadRow) => row.thread.participants?.find((participant) => participant.user_id !== userId);

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <TabTitle title={t('messages.title')} />
      </View>
      {threads && !threads.length ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40, paddingBottom: 120 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
            <EventGlyph color={theme.colors.textSecondary} />
          </View>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 19, color: theme.colors.textPrimary }}>{t('messages.emptyTitle')}</Text>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary, textAlign: 'center' }}>
            {t('messages.emptyBody')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(SCREENS.friends.add)}
              style={({ pressed }) => ({
                height: 44,
                borderRadius: 22,
                paddingHorizontal: 18,
                backgroundColor: theme.colors.fill,
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.onFill }}>{t('messages.addFriends')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.navigate(SCREENS.tabs.events)}
              style={({ pressed }) => ({
                height: 44,
                borderRadius: 22,
                paddingHorizontal: 18,
                borderWidth: 1.5,
                borderColor: '#C9CEC1',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.textPrimary }}>{t('messages.browseEvents')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          {...tabScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await load();
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }>
          <View style={{ gap: 8, marginTop: 16 }}>
            {(threads ?? []).map((row) => {
              const isEvent = row.thread.type === 'event_group';
              const person = other(row);
              const title = isEvent
                ? row.thread.event?.title || t('messages.eventChat')
                : personName(person?.user?.profile, t('messages.directMessage'));
              const last = row.thread.messages?.[0]?.body;
              return (
                <Pressable
                  key={row.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${title}. ${last ?? t('messages.noMessagesYet')}`}
                  onPress={() => router.push(SCREENS.messages.thread(row.thread_id, person?.user_id))}
                  style={({ pressed }) => ({
                    backgroundColor: theme.colors.card,
                    borderRadius: 18,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  {isEvent ? (
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#0E1113', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: '#A8E05F' }}>EV</Text>
                    </View>
                  ) : (
                    <CrewAvatar name={title} fileId={person?.user?.profile?.avatar_file_id} seed={person?.user_id} />
                  )}
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
                      {title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: last ? theme.colors.textSecondary : theme.colors.textTertiary }}>
                      {last ?? t('messages.noMessagesYet')}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
      <SafetyNudgeModal visible={nudgeVisible} onDismiss={() => void dismissNudge()} />
    </Screen>
  );
}
