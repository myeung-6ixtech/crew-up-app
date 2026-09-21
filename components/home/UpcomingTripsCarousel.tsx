import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, BodyText, NumericText, StatusDot, SectionLabel, EmptyState } from '@/components/ui';
import { HOME_SECTION_PADDING, HOME_SECTION_SPACING } from '@/constants/homeLayout';
import { useThemedStyles } from '@/theme';
import { formatAirportTimeWithZone } from '@/lib/airportTime';
import type { TripEntry } from '@/types/trip';
import {
  tripDepartureDateLabel,
  tripFlightLabel,
  tripRouteLabel,
  tripScheduleLabel,
} from '@/types/trip';

export function UpcomingTripsCarousel({
  trips,
  embedded = false,
}: {
  trips: TripEntry[];
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles((theme) => ({
    section: {
      paddingHorizontal: embedded ? 0 : HOME_SECTION_PADDING,
      marginBottom: embedded ? 0 : HOME_SECTION_SPACING,
      width: '100%',
      alignItems: 'center',
    },
    scroll: {
      gap: theme.spacing.md,
      paddingHorizontal: embedded ? 0 : undefined,
    },
    card: {
      width: embedded ? '100%' : 168,
      marginRight: embedded ? 0 : theme.spacing.md,
    },
    cardGap: { marginBottom: embedded ? theme.spacing.md : 0 },
    cardInner: { gap: theme.spacing.xs },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
  }));

  const tripCards = trips.map((trip) => {
    const stay = trip.stays?.[0];
    const flightNumber = tripFlightLabel(trip);
    // Schedule times read in each airport's local time, matching a printed roster.
    const schedule = tripScheduleLabel(trip);
    const departureDate = tripDepartureDateLabel(trip);

    return (
      <View key={trip.id} style={[styles.card, embedded && styles.cardGap]}>
        <Card>
          <View style={styles.cardInner}>
            <View style={styles.headerRow}>
              <StatusDot status="onDuty" size={8} compact />
              <BodyText strong numberOfLines={1}>
                {flightNumber ?? tripRouteLabel(trip)}
              </BodyText>
            </View>
            {flightNumber ? (
              <NumericText muted numberOfLines={1}>
                {tripRouteLabel(trip)}
              </NumericText>
            ) : null}
            {departureDate ? (
              <BodyText muted numberOfLines={1}>
                {departureDate}
              </BodyText>
            ) : null}
            {schedule ? (
              <NumericText muted numberOfLines={1}>
                {schedule}
              </NumericText>
            ) : null}
            {stay ? (
              <BodyText muted numberOfLines={1}>
                {t('trips.freeUntil', {
                  time: formatAirportTimeWithZone(stay.ends_at, stay.airport_iata ?? null),
                })}
              </BodyText>
            ) : null}
          </View>
        </Card>
      </View>
    );
  });

  return (
    <View style={styles.section}>
      {!embedded ? <SectionLabel>{t('home.whatsNext')}</SectionLabel> : null}

      {trips.length ? (
        embedded ? (
          <View style={{ width: '100%' }}>{tripCards}</View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scroll}>
            {tripCards}
          </ScrollView>
        )
      ) : (
        <EmptyState title={t('home.emptyTrips')} body={t('home.emptyTripsBody')} />
      )}
    </View>
  );
}
