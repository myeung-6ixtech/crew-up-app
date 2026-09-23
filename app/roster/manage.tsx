import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Card, Button, EmptyState, BodyText, NumericText } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { deactivateTrip, fetchMyTrips } from '@/services/tripService';
import type { TripEntry } from '@/types/trip';
import { formatAirportTimeWithZone } from '@/lib/airportTime';
import {
  tripDepartureDateLabel,
  tripFlightLabel,
  tripRouteLabel,
  tripScheduleLabel,
} from '@/types/trip';
import { useAddTripFlow } from '@/hooks/useAddTripFlow';

export default function TripManageScreen() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { openAddTrip, addTripMethodOverlay } = useAddTripFlow();
  const { userId } = useAuth();
  const [trips, setTrips] = useState<TripEntry[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const result = await fetchMyTrips(client, userId);
    setTrips(result.all);
  }, [client, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{t('trips.yourTrips')}</Title>
        <Button label={t('home.addTrip')} onPress={openAddTrip} />
        {trips.length === 0 ? (
          <EmptyState title={t('home.emptyTrips')} body={t('home.emptyTripsBody')} />
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
              <Button
                label={t('trips.removeTrip')}
                variant="destructive"
                onPress={async () => {
                  await deactivateTrip(client, trip.id);
                  await load();
                }}
              />
            </Card>
          ))
        )}
      </ScrollView>
      {addTripMethodOverlay}
    </Screen>
  );
}
