import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackGlyph, CircleButton, CrewAvatar } from '@/components/crew/kit';
import { personName, personRoleBase, type PersonProfile } from '@/components/crew/people';
import { ReportSheet } from '@/components/ReportSheet';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { INSERT_THREAD_PARTICIPANT } from '@/graphql/mutations/messaging';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient, useSubscription } from '@/lib/apolloHooks';
import { hapticImpact } from '@/lib/haptics';
import { fetchPublicProfile } from '@/services/connectionService';
import { fetchMessages, fetchThreads, markThreadRead, MESSAGES_SUBSCRIPTION, sendMessage } from '@/services/messagingService';
import { reportUser } from '@/services/safetyService';
import { fontFamily, useTheme } from '@/theme';
import type { MessageItem } from '@/types/domain';

type ThreadInfo = {
  type: string;
  eventTitle?: string | null;
  otherId: string | null;
  other: (PersonProfile & { user_id?: string }) | null;
};

/** Direct thread or event chat. Yours on the right in lime, theirs on white cards. No timestamps, no read receipts. */
export default function ChatScreen() {
  const { threadId, with: withUserId } = useLocalSearchParams<{ threadId: string; with?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<MessageItem[] | null>(null);
  const [info, setInfo] = useState<ThreadInfo>({ type: 'direct', otherId: withUserId ?? null, other: null });
  const [body, setBody] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef<FlatList<MessageItem>>(null);

  const load = useCallback(async () => {
    if (!threadId || !userId) return;
    await client
      .mutate({ mutation: INSERT_THREAD_PARTICIPANT, variables: { object: { thread_id: threadId, user_id: userId } } })
      .catch(() => undefined);
    setMessages(await fetchMessages(client, threadId));
    const rows = await fetchThreads(client, userId);
    const mine = rows.find((row: { thread_id: string }) => row.thread_id === threadId);
    if (mine) {
      const participant = mine.thread.participants?.find((p: { user_id: string }) => p.user_id !== userId);
      const otherId = participant?.user_id ?? withUserId ?? null;
      setInfo({
        type: mine.thread.type,
        eventTitle: mine.thread.event?.title,
        otherId,
        other: participant?.user?.profile ?? null,
      });
      if (!participant && otherId) {
        const profile = await fetchPublicProfile(client, otherId).catch(() => null);
        if (profile) setInfo((current) => ({ ...current, other: profile }));
      }
      await markThreadRead(client, mine.id);
    }
  }, [client, threadId, userId, withUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { threadId },
    skip: !threadId,
    onData: (result) => {
      const next = (result.data.data as { messages?: MessageItem[] } | undefined)?.messages;
      if (next) setMessages(next);
    },
  });

  const onSend = async () => {
    const text = body.trim();
    if (!threadId || !text) return;
    hapticImpact();
    setBody('');
    await sendMessage(client, threadId, text);
    await load();
  };

  const isEvent = info.type === 'event_group';
  const title = isEvent ? info.eventTitle || t('messages.eventChat') : personName(info.other, t('messages.directMessage'));
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
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          <FlatList
            ref={listRef}
            data={messages ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              return (
                <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <View
                    style={{
                      maxWidth: '76%',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 18,
                      borderBottomRightRadius: mine ? 4 : 18,
                      borderBottomLeftRadius: mine ? 18 : 4,
                      backgroundColor: mine ? theme.colors.fill : theme.colors.card,
                      borderWidth: 1,
                      borderColor: mine ? theme.colors.fill : theme.colors.hairline,
                    }}>
                    <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 20, color: mine ? theme.colors.onFill : theme.colors.textPrimary }}>
                      {item.body}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
        <View
          style={{
            paddingTop: 10,
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 10),
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: theme.colors.hairline,
            backgroundColor: theme.colors.bgCanvas,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={body}
              onChangeText={setBody}
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
              style={({ pressed }) => ({
                height: 48,
                paddingHorizontal: 18,
                borderRadius: 24,
                backgroundColor: canSend ? theme.colors.fill : theme.colors.track,
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: canSend ? theme.colors.onFill : theme.colors.textTertiary }}>
                {t('messages.send')}
              </Text>
            </Pressable>
          </View>
          {info.otherId ? (
            <Text
              accessibilityRole="button"
              onPress={() => setReportOpen(true)}
              style={{ fontFamily: fontFamily.interMedium, fontSize: 12, color: theme.colors.textTertiary, textAlign: 'center', paddingVertical: 4 }}>
              {t('safety.report')}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, details) => {
          if (info.otherId) await reportUser(client, { reason, details, reportedUserId: info.otherId });
        }}
      />
    </Screen>
  );
}
