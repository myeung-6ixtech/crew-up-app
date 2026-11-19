import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View, type ViewToken } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import Svg, { Circle, Path } from 'react-native-svg';
import { BackGlyph, CircleButton, CrewAvatar } from '@/components/crew/kit';
import { personName, personRoleBase, type PersonProfile } from '@/components/crew/people';
import { SafetySheet } from '@/components/safety/SafetySheet';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { useGuidelinesGate } from '@/features/legal/guidelinesGate';
import { INSERT_THREAD_PARTICIPANT } from '@/graphql/mutations/messaging';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient, useSubscription } from '@/lib/apolloHooks';
import { messageSendError } from '@/lib/contentErrors';
import { hapticImpact } from '@/lib/haptics';
import { fetchPublicProfile } from '@/services/connectionService';
import { waveCaption } from '@/components/discover/wave';
import {
  fetchMessages,
  fetchThreads,
  markThreadRead,
  messageWaveColumns,
  MESSAGES_SUBSCRIPTION,
  MESSAGES_SUBSCRIPTION_PLAIN,
  sendMessage,
} from '@/services/messagingService';
import { fontFamily, useTheme } from '@/theme';
import type { MessageItem } from '@/types/domain';
import { dayLabel, isDayRow, withDayDividers, type DayRow } from '@/lib/chatDay';

type ThreadInfo = {
  type: string;
  eventId?: string | null;
  eventTitle?: string | null;
  otherId: string | null;
  other: (PersonProfile & { user_id?: string }) | null;
};

/** What the shared safety sheet opens on: the person menu, or straight to reporting a message or the meet. */
type SafetyTarget = {
  start: 'menu' | 'report';
  person: { userId: string; name: string };
  report?: { messageId?: string; eventId?: string; userId?: string | null };
};

/** "9:41 AM" in the reader's own time, beside each message. */
function messageTime(iso: string | null | undefined) {
  const at = iso ? new Date(iso) : null;
  if (!at || Number.isNaN(at.getTime())) return '';
  return at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Apply live rows onto the open page. New rows append. A removal updates a row already on screen. */
function mergeLive(current: MessageItem[], incoming: MessageItem[], since: string): MessageItem[] {
  const sinceMs = Date.parse(since);
  const known = new Map(current.map((message) => [message.id, message]));
  const appended: MessageItem[] = [];
  let changed = false;
  for (const row of incoming) {
    if (known.has(row.id)) {
      known.set(row.id, row);
      changed = true;
    } else if (Date.parse(row.created_at) >= sinceMs) {
      appended.push(row);
      changed = true;
    }
  }
  if (!changed) return current;
  appended.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  return [...current.map((message) => known.get(message.id) ?? message), ...appended];
}

function MoreGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={1.9} fill={color} />
      <Circle cx={12} cy={12} r={1.9} fill={color} />
      <Circle cx={19} cy={12} r={1.9} fill={color} />
    </Svg>
  );
}

/** Direct thread or event chat. Yours on the right in lime, theirs on white cards. No timestamps, no read receipts. */

/** Extra lift above the Android keyboard (its suggestion strip isn't always in the reported height). */
const ANDROID_KEYBOARD_GAP = 24;
export default function ChatScreen() {
  const { threadId, with: withUserId } = useLocalSearchParams<{ threadId: string; with?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  // Android: while the keyboard is up the nav-bar inset no longer applies, and some keyboards report a height that
  // leaves out their suggestion strip, so the composer gets lifted clear of it instead of tucking underneath.
  const [androidKeyboard, setAndroidKeyboard] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setAndroidKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setAndroidKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const client = useApolloClient();
  const { userId } = useAuth();
  const ensureGuidelines = useGuidelinesGate();
  const [messages, setMessages] = useState<MessageItem[] | null>(null);
  const [waveLive, setWaveLive] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [liveSince, setLiveSince] = useState<string | null>(null);
  const [info, setInfo] = useState<ThreadInfo>({ type: 'direct', otherId: withUserId ?? null, other: null });
  const [body, setBody] = useState('');
  const [sendError, setSendError] = useState('');
  const [safety, setSafety] = useState<SafetyTarget | null>(null);
  // Floating day pill (WhatsApp-style): shows the day of the top message while scrolling, then fades.
  const [pillLabel, setPillLabel] = useState('');
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showPill = () => {
    if (pillTimer.current) clearTimeout(pillTimer.current);
    Animated.timing(pillOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };
  const hidePillSoon = () => {
    if (pillTimer.current) clearTimeout(pillTimer.current);
    pillTimer.current = setTimeout(() => Animated.timing(pillOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(), 1200);
  };
  const dayLabels = { today: t('messages.today'), yesterday: t('messages.yesterday') };
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Inverted list: the highest index on screen is the one at the top.
    const top = viewableItems.reduce<ViewToken | null>((best, token) => (best === null || (token.index ?? 0) > (best.index ?? 0) ? token : best), null);
    const row = top?.item as (MessageItem | DayRow) | undefined;
    const at = row ? (isDayRow(row) ? row.at : row.created_at) : null;
    if (at) setPillLabel(at);
  }).current;

  const load = useCallback(async () => {
    if (!threadId || !userId) return;
    await client
      .mutate({ mutation: INSERT_THREAD_PARTICIPANT, variables: { object: { thread_id: threadId, user_id: userId } } })
      .catch(() => undefined);
    const page = await fetchMessages(client, threadId);
    setWaveLive(messageWaveColumns());
    setMessages(page.messages);
    setHasMore(page.hasMore);
    const newest = page.messages[page.messages.length - 1]?.created_at;
    setLiveSince(newest ?? new Date(Date.now() - 5000).toISOString());
    const rows = await fetchThreads(client, userId);
    const mine = rows.find((row: { thread_id: string }) => row.thread_id === threadId);
    if (mine) {
      const participant = mine.thread.participants?.find((p: { user_id: string }) => p.user_id !== userId);
      const otherId = participant?.user_id ?? withUserId ?? null;
      let other = participant?.user?.profile ?? null;
      if (!personName(other) && otherId) {
        other = (await fetchPublicProfile(client, otherId).catch(() => null)) ?? other;
      }
      setInfo({
        type: mine.thread.type,
        eventId: mine.thread.event_id,
        eventTitle: mine.thread.event?.title,
        otherId,
        other,
      });
      await markThreadRead(client, mine.id);
    } else if (withUserId) {
      const profile = await fetchPublicProfile(client, withUserId).catch(() => null);
      setInfo({ type: 'direct', otherId: withUserId, other: profile });
    }
  }, [client, threadId, userId, withUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadEarlier = async () => {
    if (!threadId || !messages?.length || !hasMore || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const page = await fetchMessages(client, threadId, messages[0].created_at);
      setHasMore(page.hasMore);
      setMessages((current) => {
        const ids = new Set((current ?? []).map((message) => message.id));
        return [...page.messages.filter((message) => !ids.has(message.id)), ...(current ?? [])];
      });
    } finally {
      setLoadingEarlier(false);
    }
  };

  useSubscription(waveLive ? MESSAGES_SUBSCRIPTION : MESSAGES_SUBSCRIPTION_PLAIN, {
    variables: { threadId, since: liveSince },
    skip: !threadId || !liveSince,
    onData: (result) => {
      const incoming = (result.data.data as { messages?: MessageItem[] } | undefined)?.messages;
      if (!incoming || !liveSince) return;
      setMessages((current) => mergeLive(current ?? [], incoming, liveSince));
    },
  });

  const onSend = async () => {
    const text = body.trim();
    if (!threadId || !text || !userId) return;
    if (!(await ensureGuidelines())) return;
    hapticImpact();
    setBody('');
    setSendError('');
    try {
      const sent = await sendMessage(client, threadId, text);
      if (sent?.id) {
        const row: MessageItem = {
          id: sent.id,
          thread_id: threadId,
          sender_id: userId,
          body: text,
          removed_at: null,
          created_at: sent.created_at,
        };
        setMessages((current) => (current?.some((message) => message.id === row.id) ? current : [...(current ?? []), row]));
      }
    } catch (e) {
      setBody(text);
      setSendError(messageSendError(e, t));
    }
  };

  const isEvent = info.type === 'event_group';
  const title = isEvent ? info.eventTitle || t('messages.eventChat') : personName(info.other, t('messages.directMessage'));

  const openActions = () => {
    if (isEvent) {
      // A meet chat: report the meet (there's no single person to block from here).
      setSafety({ start: 'report', person: { userId: '', name: title }, report: { eventId: info.eventId ?? undefined, userId: null } });
      return;
    }
    if (!info.otherId) return;
    setSafety({ start: 'menu', person: { userId: info.otherId, name: title.split(' ')[0] } });
  };

  const onLongPressMessage = (item: MessageItem) => {
    if (item.sender_id === userId || item.removed_at) return;
    hapticImpact();
    Alert.alert(t('report.messageTitle'), item.body ?? undefined, [
      {
        text: t('report.message'),
        onPress: () =>
          setSafety({
            start: 'report',
            person: { userId: item.sender_id ?? '', name: isEvent ? '' : title.split(' ')[0] },
            report: { messageId: item.id, userId: item.sender_id },
          }),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const subtitle = isEvent ? null : personRoleBase(info.other, t);
  const firstName = title.split(' ')[0];
  const canSend = Boolean(body.trim());

  return (
    <Screen style={{ padding: 0 }}>
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.hairline,
        }}>
        <CircleButton accessibilityLabel={t('onboarding.back')} onPress={() => router.back()}>
          <BackGlyph color={theme.colors.textPrimary} />
        </CircleButton>
        <Pressable
          accessibilityRole={info.otherId && !isEvent ? 'button' : undefined}
          disabled={!info.otherId || isEvent}
          onPress={() => info.otherId && router.push(SCREENS.network.user(info.otherId))}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {isEvent ? (
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#0E1113', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13, color: '#A8E05F' }}>EV</Text>
            </View>
          ) : (
            <CrewAvatar size={40} name={title} fileId={info.other?.avatar_file_id} seed={info.otherId} />
          )}
          <View style={{ flex: 1, gap: 1 }}>
            <Text accessibilityRole="header" numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>
              {title}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
        {(isEvent ? info.eventId : info.otherId) ? (
          <CircleButton accessibilityLabel={t('report.chatActions')} onPress={openActions}>
            <MoreGlyph color={theme.colors.textPrimary} />
          </CircleButton>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'android' ? (androidKeyboard ? ANDROID_KEYBOARD_GAP : -insets.bottom) : 0}>
        {messages && !messages.length && !isEvent ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 }}>
            <CrewAvatar size={76} name={title} fileId={info.other?.avatar_file_id} seed={info.otherId} />
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 19, color: theme.colors.textPrimary, marginTop: 6, textAlign: 'center' }}>
              {t('messages.friendsWith', { name: firstName })}
            </Text>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, textAlign: 'center' }}>
              {t('messages.noMessagesYet')}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
          <FlatList
            inverted
            data={withDayDividers([...(messages ?? [])].reverse())}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}
            onScrollBeginDrag={showPill}
            onScrollEndDrag={hidePillSoon}
            onMomentumScrollBegin={showPill}
            onMomentumScrollEnd={hidePillSoon}
            contentContainerStyle={{ flexGrow: 1, gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
            ListFooterComponent={
              hasMore ? (
                <Pressable accessibilityRole="button" disabled={loadingEarlier} onPress={() => void loadEarlier()} style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.accentText }}>
                    {loadingEarlier ? t('messages.loadingEarlier') : t('messages.earlier')}
                  </Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item: row }) => {
              if (isDayRow(row)) {
                // Day divider between days, like WhatsApp.
                return (
                  <View accessibilityRole="header" style={{ alignItems: 'center', paddingVertical: 8 }}>
                    <Text
                      style={{
                        fontFamily: fontFamily.interMedium,
                        fontSize: 11.5,
                        color: theme.colors.textSecondary,
                        backgroundColor: theme.colors.field,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}>
                      {dayLabel(row.at, dayLabels)}
                    </Text>
                  </View>
                );
              }
              const item = row as MessageItem;
              const mine = item.sender_id === userId;
              const removed = Boolean(item.removed_at);
              if (item.kind === 'wave' && !removed) {
                return (
                  <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                    <View
                      style={{
                        maxWidth: '88%',
                        backgroundColor: theme.colors.accentSubtle,
                        borderRadius: 14,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      }}>
                      <Text style={{ textAlign: 'center', fontFamily: fontFamily.interMedium, fontSize: 12.5, lineHeight: 18, color: theme.colors.accentText }}>
                        {waveCaption(item.meta, { mine, name: firstName }, t)}
                      </Text>
                    </View>
                  </View>
                );
              }
              const time = messageTime(item.created_at);
              const stamp = time ? (
                <Text
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={{ fontFamily: fontFamily.interRegular, fontSize: 10.5, color: theme.colors.textTertiary, marginBottom: 3 }}>
                  {time}
                </Text>
              ) : null;
              return (
                <Pressable
                  onLongPress={() => onLongPressMessage(item)}
                  disabled={mine || removed}
                  accessibilityHint={mine || removed ? undefined : t('report.message')}
                  accessibilityLabel={removed ? undefined : [item.body, time].filter(Boolean).join(', ')}
                  style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  {/* Time sits on the outer side: left of your bubbles, right of theirs. */}
                  {mine ? stamp : null}
                  <View
                    style={{
                      maxWidth: '72%',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 18,
                      borderBottomRightRadius: mine ? 4 : 18,
                      borderBottomLeftRadius: mine ? 18 : 4,
                      backgroundColor: mine ? theme.colors.fill : theme.colors.card,
                      borderWidth: 1,
                      borderColor: mine ? theme.colors.fill : theme.colors.hairline,
                    }}>
                    {removed ? (
                      <Text style={{ fontFamily: fontFamily.interRegular, fontStyle: 'italic', fontSize: 14, lineHeight: 20, color: theme.colors.textTertiary }}>
                        {t('accountDelete.messageRemoved')}
                      </Text>
                    ) : (
                      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 20, color: mine ? theme.colors.onFill : theme.colors.textPrimary }}>
                        {item.body}
                      </Text>
                    )}
                  </View>
                  {mine ? null : stamp}
                </Pressable>
              );
            }}
          />
          {/* Floating day pill at the top while scrolling ("Today", "Yesterday", …). */}
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', opacity: pillOpacity }}>
            {pillLabel ? (
              <Text
                style={{
                  fontFamily: fontFamily.interMedium,
                  fontSize: 11.5,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 11,
                  overflow: 'hidden',
                  shadowColor: '#0E1113',
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                }}>
                {dayLabel(pillLabel, dayLabels)}
              </Text>
            ) : null}
          </Animated.View>
          </View>
        )}
        <View
          style={{
            paddingTop: 10,
            paddingHorizontal: 16,
            paddingBottom: androidKeyboard ? 14 : Math.max(insets.bottom, 10),
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: theme.colors.hairline,
            backgroundColor: theme.colors.bgCanvas,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={body}
              onChangeText={setBody}
              maxLength={2000}
              placeholder={t('messages.placeholder')}
              placeholderTextColor={theme.colors.textTertiary}
              accessibilityLabel={t('messages.placeholder')}
              onSubmitEditing={() => void onSend()}
              returnKeyType="send"
              style={{
                flex: 1,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.colors.card,
                borderWidth: 1.5,
                borderColor: theme.colors.track,
                paddingHorizontal: 18,
                fontFamily: fontFamily.interRegular,
                fontSize: 15,
                color: theme.colors.textPrimary,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={() => void onSend()}
              accessibilityLabel={t('messages.send')}
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: canSend ? theme.colors.fill : theme.colors.track,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.99.99 0 00-1.38 1.17L4.5 12l-2.48 7.23a.99.99 0 001.38 1.17zM4.5 12h7"
                  stroke={canSend ? theme.colors.onFill : theme.colors.textTertiary}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
          {sendError ? (
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interMedium, fontSize: 12.5, lineHeight: 18, color: theme.colors.statusOnDuty, textAlign: 'center' }}>
              {sendError}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
      {safety ? (
        <SafetySheet
          visible
          onClose={() => setSafety(null)}
          person={safety.person}
          isFriend={!isEvent}
          start={safety.start}
          report={safety.report}
          context={{ source: isEvent ? 'event' : 'chat', relationship: isEvent ? undefined : 'friends' }}
          onDone={(action) => {
            // Unfriending or blocking closes this chat.
            if (action === 'blocked' || action === 'unfriended') router.back();
          }}
        />
      ) : null}
    </Screen>
  );
}
