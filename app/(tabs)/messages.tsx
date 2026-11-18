import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation, type TFunction } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import Svg, { Path } from 'react-native-svg';
import { CrewAvatar, TabTitle } from '@/components/crew/kit';
import { personName, type PersonProfile } from '@/components/crew/people';
import { SafetyNudgeModal } from '@/components/SafetyNudgeModal';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { useAuth } from '@/hooks/useSession';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticSelection } from '@/lib/haptics';
import { fetchBlocks, fetchPublicProfile } from '@/services/connectionService';
import { waveCaption, type WaveMeta } from '@/components/discover/wave';
import { fetchDirectCounterparts, fetchThreads, isThreadUnread, type DirectCounterpart } from '@/services/messagingService';
import { useSafetyStore } from '@/stores/safetyStore';
import { fontFamily, useTheme } from '@/theme';

type InboxTab = 'all' | 'read' | 'unread';

type ThreadRow = {
  id: string;
  thread_id: string;
  last_read_at?: string | null;
  thread: {
    type: string;
    updated_at?: string;
    event?: { title?: string | null } | null;
    messages?: { body?: string | null; kind?: string | null; meta?: WaveMeta | null; sender_id?: string | null; created_at?: string }[];
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

/** Short stamp for the latest message: now, 5m, 3h, 2d, then a short date. */
function shortRelativeTime(iso: string, now: number, t: TFunction): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) return t('messages.justNow');
  if (minutes < 60) return t('messages.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('messages.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('messages.daysAgo', { count: days });
  const date = new Date(then);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(undefined, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: '2-digit' });
}

/** One card per thread: who (or which meet), then the latest line. Event chats share the inbox. */
export default function MessagesTab() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const { nudgeVisible, checkNudge, dismissNudge } = useSafetyStore();
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [peers, setPeers] = useState<Map<string, DirectCounterpart>>(new Map());
  const [tab, setTab] = useState<InboxTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const tabScroll = useTabBarScroll({ contentContainerStyle: { paddingHorizontal: 24 } });

  const load = useCallback(async () => {
    if (!userId) return;
    let rows: ThreadRow[];
    try {
      rows = await fetchThreads(client, userId);
    } catch {
      return;
    }
    const blocks: { blocked_id: string }[] = await fetchBlocks(client, userId).catch(() => []);
    const blocked = new Set(blocks.map((block) => block.blocked_id));
    const visible = rows.filter(
      (row) => row.thread.type !== 'direct' || !row.thread.participants?.some((p) => p.user_id !== userId && blocked.has(p.user_id)),
    );
    const latest = (row: ThreadRow) => row.thread.messages?.[0]?.created_at ?? row.thread.updated_at ?? '';
    const ordered = visible.sort((a, b) => (latest(a) < latest(b) ? 1 : -1));
    const directIds = ordered.filter((row) => row.thread.type === 'direct').map((row) => row.thread_id);
    const found = await fetchDirectCounterparts(client, userId, directIds).catch(() => []);
    await Promise.all(
      found.map(async (peer) => {
        if (personName(peer.profile)) return;
        const profile = await fetchPublicProfile(client, peer.user_id).catch(() => null);
        if (profile) peer.profile = profile;
      }),
    );
    setPeers(new Map(found.map((peer) => [peer.thread_id, peer])));
    setThreads(ordered);
    void checkNudge();
  }, [client, userId, checkNudge]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const other = (row: ThreadRow) => row.thread.participants?.find((participant) => participant.user_id !== userId);
  const unreadCount = (threads ?? []).filter((row) => (userId ? isThreadUnread(row, userId) : false)).length;
  const shown = (threads ?? []).filter((row) => {
    if (tab === 'all') return true;
    return (userId ? isThreadUnread(row, userId) : false) === (tab === 'unread');
  });
  const tabs: { key: InboxTab; label: string }[] = [
    { key: 'all', label: t('messages.all') },
    { key: 'read', label: t('messages.read') },
    { key: 'unread', label: t('messages.unread') },
  ];

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <TabTitle title={t('messages.title')} />
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8, marginTop: 16, paddingHorizontal: 24 }}>
          {tabs.map((item) => {
            const selected = tab === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={item.key === 'unread' ? `${item.label}, ${unreadCount}` : item.label}
                onPress={() => {
                  hapticSelection();
                  setTab(item.key);
                }}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: selected ? theme.colors.ink : theme.colors.field,
                  justifyContent: 'center',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: selected ? theme.colors.ground : theme.colors.textPrimary }}>
                    {item.label}
                  </Text>
                  {item.key === 'unread' ? (
                    <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: selected ? theme.colors.ground : theme.colors.textSecondary }}>
                      {unreadCount}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
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
          {shown.length ? null : (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 48 }}>
              {tab === 'unread' ? t('messages.emptyUnread') : tab === 'read' ? t('messages.emptyRead') : t('messages.emptyAll')}
            </Text>
          )}
          <View style={{ gap: 8, marginTop: 16 }}>
            {shown.map((row) => {
              const isEvent = row.thread.type === 'event_group';
              const person = other(row);
              const peer = peers.get(row.thread_id);
              const otherId = person?.user_id ?? peer?.user_id;
              const profile = person?.user?.profile ?? peer?.profile;
              const title = isEvent
                ? row.thread.event?.title || t('messages.eventChat')
                : personName(profile, t('messages.directMessage'));
              const last = row.thread.messages?.[0];
              const stamp = last?.created_at ? shortRelativeTime(last.created_at, now, t) : '';
              const unread = userId ? isThreadUnread(row, userId) : false;
              const preview =
                last?.kind === 'wave'
                  ? waveCaption(last.meta, { mine: last.sender_id === userId, name: title.split(' ')[0], inbox: true }, t)
                  : last?.body
                    ? last.sender_id === userId
                      ? `${t('messages.you')}: ${last.body}`
                      : last.body
                    : t('messages.noMessagesYet');
              return (
                <Pressable
                  key={row.id}
                  accessibilityRole="button"
                  accessibilityLabel={stamp ? `${title}. ${stamp}. ${preview}` : `${title}. ${preview}`}
                  onPress={() => router.push(SCREENS.messages.thread(row.thread_id, otherId))}
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
                    <CrewAvatar name={title} fileId={profile?.avatar_file_id} seed={otherId} />
                  )}
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text numberOfLines={1} style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
                        {title}
                      </Text>
                      {stamp ? (
                        <Text style={{ fontFamily: unread ? fontFamily.interMedium : fontFamily.interRegular, fontSize: 12, color: unread ? theme.colors.textPrimary : theme.colors.textTertiary }}>
                          {stamp}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: last?.body ? theme.colors.textSecondary : theme.colors.textTertiary }}>
                      {preview}
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
