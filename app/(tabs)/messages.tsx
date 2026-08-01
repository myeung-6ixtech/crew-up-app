import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Card, Title, EmptyState } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchThreads } from '@/services/messagingService';
import { SCREENS } from '@/constants/screens';
import { SafetyNudgeModal } from '@/components/SafetyNudgeModal';
import { useSafetyStore } from '@/stores/safetyStore';

export default function MessagesTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const { nudgeVisible, checkNudge, dismissNudge } = useSafetyStore();
  const [threads, setThreads] = useState<
    { id: string; thread_id: string; thread: { type: string; event?: { title?: string }; messages?: { body?: string }[]; participants?: { user?: { profile?: { display_name?: string } } }[] } }[]
  >([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setThreads(await fetchThreads(client, userId));
    void checkNudge();
  }, [client, userId, checkNudge]);

  useEffect(() => {
    void load();
  }, [load]);

  const threadTitle = (item: (typeof threads)[0]) => {
    if (item.thread.type === 'event_group') return item.thread.event?.title ?? 'Event chat';
    const other = item.thread.participants?.find((p) => p.user?.profile?.display_name)?.user?.profile
      ?.display_name;
    return other ?? 'Direct message';
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{t('messages.title')}</Title>
        {threads.length === 0 ? (
          <EmptyState title="No conversations yet" body="Connect with crew or join an event to start chatting." />
        ) : (
          threads.map((item) => (
            <Pressable key={item.id} onPress={() => router.push(SCREENS.messages.thread(item.thread_id))}>
              <Card>
                <Text style={{ fontWeight: '600' }}>{threadTitle(item)}</Text>
                <Text numberOfLines={1}>{item.thread.messages?.[0]?.body ?? 'No messages yet'}</Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
      <SafetyNudgeModal visible={nudgeVisible} onDismiss={() => void dismissNudge()} />
    </Screen>
  );
}
