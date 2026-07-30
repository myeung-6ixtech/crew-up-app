import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Subtitle, Card, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchEvent, rsvpEvent } from '@/services/eventService';
import { ReportSheet } from '@/components/ReportSheet';
import { reportUser } from '@/services/safetyService';
import { formatDateTime } from '@/lib/utils';
import { SCREENS } from '@/constants/screens';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [event, setEvent] = useState<{
    id: string;
    title: string;
    description?: string;
    city: string;
    starts_at: string;
    creator_id: string;
    attendees?: { id: string; user_id: string; status: string }[];
  } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setEvent(await fetchEvent(client, id));
  }, [client, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const myRsvp = event?.attendees?.find((a) => a.user_id === userId);

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{event?.title ?? t('common.loading')}</Title>
        {event ? (
          <>
            <Subtitle>{event.city} · {formatDateTime(event.starts_at)}</Subtitle>
            <Card><Text>{event.description ?? 'No description'}</Text></Card>
            <Text>{event.attendees?.length ?? 0} attending</Text>
            {!myRsvp ? (
              <Button
                label={t('events.rsvp')}
                onPress={async () => {
                  if (!userId || !event) return;
                  await rsvpEvent(client, event.id, userId);
                  await load();
                }}
              />
            ) : (
              <Button label={myRsvp.status === 'going' ? t('events.going') : t('events.waitlisted')} variant="secondary" onPress={() => {}} />
            )}
            <Button label={t('safety.report')} variant="secondary" onPress={() => setReportOpen(true)} />
          </>
        ) : null}
      </ScrollView>
      {event ? (
        <ReportSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          onSubmit={async (reason, details) => {
            await reportUser(client, { reason, details, reportedEventId: event.id, reportedUserId: event.creator_id });
          }}
        />
      ) : null}
    </Screen>
  );
}
