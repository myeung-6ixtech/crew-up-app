import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import {
  Screen,
  Card,
  EmptyState,
  BodyText,
  NumericText,
  PillSelectorGroup,
} from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchTripHistory } from '@/services/tripService';
import type { TripEntry } from '@/types/trip';
import { formatAirportTimeWithZone } from '@/lib/airportTime';
import {
  tripDepartureDateLabel,
  tripFlightLabel,
  tripRouteLabel,
  tripScheduleLabel,
} from '@/types/trip';
import { useTheme, useThemedStyles } from '@/theme';

type TripTab = 'upcoming' | 'past';

export default function TripsScreen() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const theme = useTheme();
  const { userId } = useAuth();
  const [tab, setTab] = useState<TripTab>('upcoming');
  const [upcoming, setUpcoming] = useState<TripEntry[]>([]);
  const [past, setPast] = useState<TripEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = useThemedStyles((theme) => ({
    content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
    loading: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
  }));

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await fetchTripHistory(client, userId);
      setUpcoming(result.upcoming);
      setPast(result.past);
    } finally {
      setLoading(false);
    }
  }, [client, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const trips = tab === 'upcoming' ? upcoming : past;

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <PillSelectorGroup
          options={[
            { value: 'upcoming', label: t('trips.upcoming') },
            { value: 'past', label: t('trips.past') },
          ]}
          value={tab}
          onChange={setTab}
        />
        {loading ? (
          <ActivityIndicator style={styles.loading} color={theme.colors.accentText} />
        ) : trips.length === 0 ? (
          <EmptyState
            title={tab === 'upcoming' ? t('trips.emptyUpcoming') : t('trips.emptyPast')}
            body={tab === 'upcoming' ? t('trips.emptyUpcomingBody') : t('trips.emptyPastBody')}
          />
        ) : (
          trips.map((trip) => (
            <Card key={trip.id}>
              <BodyText strong>
                {tripFlightLabel(trip, { withRoute: true }) ?? tripRouteLabel(trip)}
              </BodyText>
              {tripDepartureDateLabel(trip) ? (
                <BodyText muted>{tripDepartureDateLabel(trip)}</BodyText>
              ) : null}
              {tripScheduleLabel(trip) ? (
                <NumericText muted>{tripScheduleLabel(trip)}</NumericText>
              ) : null}
              {trip.stays?.[0] ? (
                <BodyText muted>
                  {t('trips.freeUntil', {
                    time: formatAirportTimeWithZone(
                      trip.stays[0].ends_at,
                      trip.stays[0].airport_iata ?? null,
                    ),
                  })}
                </BodyText>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
