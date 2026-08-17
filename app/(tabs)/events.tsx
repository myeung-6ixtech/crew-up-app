import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Pressable, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Card, Title, EmptyState, BodyText, NumericText } from '@/components/ui';
import { fetchEvents } from '@/services/eventService';
import type { EventItem } from '@/types/domain';
import { SCREENS } from '@/constants/screens';
import { formatDateTime } from '@/lib/utils';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useCreateEventFlow } from '@/hooks/useCreateEventFlow';

type EventFilter = 'all' | 'platform' | 'community';

function isPlatformEvent(event: EventItem) {
  return event.host_type === 'platform';
}

export default function EventsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { openCreateEvent, meetTypeOverlay } = useCreateEventFlow();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState<EventFilter>('all');

  const load = useCallback(async () => {
    setEvents(await fetchEvents(client));
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredEvents = useMemo(() => {
    if (filter === 'platform') {
      return events.filter(isPlatformEvent);
    }
    if (filter === 'community') {
      return events.filter((event) => !isPlatformEvent(event));
    }
    return events;
  }, [events, filter]);

  const tabScroll = useTabBarScroll({ contentContainerStyle: { padding: 16 } });

  return (
    <Screen style={{ padding: 0 }}>
      {meetTypeOverlay}
      <ScrollView {...tabScroll}>
        <Title>{t('tabs.events')}</Title>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(['all', 'platform', 'community'] as EventFilter[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={{
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: filter === value ? '#18181b' : '#f4f4f5',
              }}
            >
              <Text style={{ color: filter === value ? '#fff' : '#3f3f46', fontSize: 13 }}>
                {t(`events.filter.${value}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        {filteredEvents.length === 0 ? (
          <EmptyState
            title={t('home.emptyEvents')}
            body={t('home.emptyEventsBody')}
            actionLabel={t('events.createEvent')}
            onAction={openCreateEvent}
          />
        ) : (
          filteredEvents.map((event) => (
            <Pressable key={event.id} onPress={() => router.push(SCREENS.events.detail(event.id))}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BodyText strong>{event.title}</BodyText>
                  {isPlatformEvent(event) ? (
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: '#1d4ed8',
                        backgroundColor: '#dbeafe',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      {t('events.platformBadge')}
                    </Text>
                  ) : null}
                </View>
                <NumericText muted>
                  {event.city} · {formatDateTime(event.starts_at)}
                </NumericText>
                {isPlatformEvent(event) ? (
                  <BodyText muted>{t('events.hostedByCrewUp')}</BodyText>
                ) : null}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
