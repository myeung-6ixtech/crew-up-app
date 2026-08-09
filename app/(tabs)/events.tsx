import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Card, Title, EmptyState, BodyText, NumericText } from '@/components/ui';
import { fetchEvents } from '@/services/eventService';
import { SCREENS } from '@/constants/screens';
import { formatDateTime } from '@/lib/utils';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useCreateEventFlow } from '@/hooks/useCreateEventFlow';

export default function EventsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { openCreateEvent, meetTypeOverlay } = useCreateEventFlow();
  const [events, setEvents] = useState<{ id: string; title: string; city: string; starts_at: string }[]>([]);

  const load = useCallback(async () => {
    setEvents(await fetchEvents(client));
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabScroll = useTabBarScroll({ contentContainerStyle: { padding: 16 } });

  return (
    <Screen style={{ padding: 0 }}>
      {meetTypeOverlay}
      <ScrollView {...tabScroll}>
        <Title>{t('tabs.events')}</Title>
        {events.length === 0 ? (
          <EmptyState
            title={t('home.emptyEvents')}
            body={t('home.emptyEventsBody')}
            actionLabel={t('events.createEvent')}
            onAction={openCreateEvent}
          />
        ) : (
          events.map((e) => (
            <Pressable key={e.id} onPress={() => router.push(SCREENS.events.detail(e.id))}>
              <Card>
                <BodyText strong>{e.title}</BodyText>
                <NumericText muted>{e.city} · {formatDateTime(e.starts_at)}</NumericText>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
