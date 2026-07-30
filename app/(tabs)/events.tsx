import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Card, Title, Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchEvents } from '@/services/eventService';
import { SCREENS } from '@/constants/screens';
import { formatDateTime } from '@/lib/utils';

export default function EventsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { isVerified } = useAuth();
  const [events, setEvents] = useState<{ id: string; title: string; city: string; starts_at: string }[]>([]);

  const load = useCallback(async () => {
    setEvents(await fetchEvents(client));
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isVerified) {
    return (
      <Screen>
        <EmptyState title={t('verification.pending')} body={t('verification.pendingBody')} />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Button label={t('events.create')} onPress={() => router.push(SCREENS.events.create)} />
        <Title>{t('tabs.events')}</Title>
        {events.length === 0 ? (
          <EmptyState title="No upcoming meetups" />
        ) : (
          events.map((e) => (
            <Pressable key={e.id} onPress={() => router.push(SCREENS.events.detail(e.id))}>
              <Card>
                <Text style={{ fontWeight: '600' }}>{e.title}</Text>
                <Text>{e.city} · {formatDateTime(e.starts_at)}</Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
