import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient, useSubscription } from '@/lib/apolloHooks';
import { Screen, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import {
  fetchMessages,
  fetchThreads,
  markThreadRead,
  MESSAGES_SUBSCRIPTION,
  sendMessage,
} from '@/services/messagingService';
import { INSERT_THREAD_PARTICIPANT } from '@/graphql/mutations/messaging';
import { ReportSheet } from '@/components/ReportSheet';
import { reportUser } from '@/services/safetyService';
import type { MessageItem } from '@/types/domain';

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { t } = useTranslation();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [body, setBody] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!threadId || !userId) return;
    await client
      .mutate({
        mutation: INSERT_THREAD_PARTICIPANT,
        variables: { object: { thread_id: threadId, user_id: userId } },
      })
      .catch(() => undefined);
    setMessages(await fetchMessages(client, threadId));
    const participants = await fetchThreads(client, userId);
    const mine = participants.find((p: { thread_id: string; id: string; thread: { participants?: { user_id: string }[] } }) => p.thread_id === threadId);
    if (mine) {
      setParticipantId(mine.id);
      const other = mine.thread.participants?.find((p: { user_id: string }) => p.user_id !== userId);
      setOtherUserId(other?.user_id ?? null);
      await markThreadRead(client, mine.id);
    }
  }, [client, threadId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { threadId },
    skip: !threadId,
    onData: (result) => {
      const messages = (result.data.data as { messages?: MessageItem[] } | undefined)?.messages;
      if (messages) setMessages(messages);
    },
  });

  const onSend = async () => {
    if (!threadId || !body.trim()) return;
    const text = body.trim();
    setBody('');
    await sendMessage(client, threadId, text);
    await load();
  };

  return (
    <Screen style={{ padding: 0, flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.sender_id === userId ? 'flex-end' : 'flex-start',
                backgroundColor: item.sender_id === userId ? '#DBEAFE' : '#F1F5F9',
                padding: 10,
                borderRadius: 12,
                marginBottom: 8,
                maxWidth: '80%',
              }}>
              <Text>{item.body}</Text>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderColor: '#E2E8F0' }}>
          <TextInput
            style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10 }}
            value={body}
            onChangeText={setBody}
            placeholder={t('messages.placeholder')}
          />
          <Button label={t('messages.send')} onPress={onSend} />
        </View>
        <Button label={t('safety.report')} variant="secondary" onPress={() => setReportOpen(true)} />
      </KeyboardAvoidingView>
      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, details) => {
          if (otherUserId) {
            await reportUser(client, { reason, details, reportedUserId: otherUserId });
          }
        }}
      />
    </Screen>
  );
}
