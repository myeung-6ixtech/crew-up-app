import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BodyText, NumericText } from '@/components/ui';
import { airportDayOffset, formatAirportDate, formatAirportTimeWithZone } from '@/lib/airportTime';
import type { FlightOption } from '@/types/flight';
import { useThemedStyles } from '@/theme';

type FlightSearchResultsProps = {
  flights: FlightOption[];
  selectedFlightId?: string;
  onSelect: (flight: FlightOption) => void;
};

export function FlightSearchResults({
  flights,
  selectedFlightId,
  onSelect,
}: FlightSearchResultsProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles((t) => ({
    wrap: { width: '100%', gap: t.spacing.sm },
    row: {
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.card,
      padding: t.spacing.md,
      backgroundColor: t.colors.bgSurfaceRaised,
    },
    rowSelected: {
      borderColor: t.colors.accentText,
      backgroundColor: t.colors.accentSubtle,
    },
    topLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    flightNumber: {
      color: t.colors.textPrimary,
    },
    flightNumberSelected: {
      color: t.colors.accentText,
    },
    timeline: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing.sm,
    },
    endpoint: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    endpointEnd: {
      alignItems: 'flex-end',
    },
    airport: {
      color: t.colors.textPrimary,
    },
    time: {
      ...t.typography.bodyStrong,
      color: t.colors.textPrimary,
    },
    arrow: {
      ...t.typography.body,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    rollover: {
      ...t.typography.caption,
      color: t.colors.accentText,
    },
  }));

  if (flights.length === 0) {
    return (
      <BodyText muted style={{ textAlign: 'center' }}>
        {t('addTrip.noFlightsFound')}
      </BodyText>
    );
  }

  return (
    <View style={styles.wrap}>
      {flights.map((flight) => {
        const selected = selectedFlightId === flight.id;
        // Times are rendered in each endpoint's own timezone, so an overnight or
        // date-line crossing needs an explicit day marker.
        const dayOffset = airportDayOffset(
          flight.departureTime,
          flight.departureAirport,
          flight.arrivalTime,
          flight.arrivalAirport,
        );

        return (
          <Pressable
            key={flight.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(flight)}
            style={({ pressed }) => [
              styles.row,
              selected ? styles.rowSelected : null,
              { opacity: pressed ? 0.82 : 1 },
            ]}>
            <View style={styles.topLine}>
              <NumericText
                style={[styles.flightNumber, selected ? styles.flightNumberSelected : null]}>
                {flight.flightNumber}
              </NumericText>
              <BodyText muted numberOfLines={1}>
                {flight.airline}
              </BodyText>
            </View>

            <View style={styles.timeline}>
              <View style={styles.endpoint}>
                <NumericText style={styles.airport}>{flight.departureAirport}</NumericText>
                <Text style={styles.time}>
                  {formatAirportTimeWithZone(flight.departureTime, flight.departureAirport)}
                </Text>
                <BodyText muted numberOfLines={1}>
                  {formatAirportDate(flight.departureTime, flight.departureAirport)}
                </BodyText>
              </View>

              <Text style={styles.arrow}>→</Text>

              <View style={[styles.endpoint, styles.endpointEnd]}>
                <NumericText style={styles.airport}>{flight.arrivalAirport}</NumericText>
                <Text style={styles.time}>
                  {formatAirportTimeWithZone(flight.arrivalTime, flight.arrivalAirport)}
                </Text>
                <BodyText muted numberOfLines={1}>
                  {formatAirportDate(flight.arrivalTime, flight.arrivalAirport)}
                </BodyText>
                {dayOffset !== 0 ? (
                  <Text style={styles.rollover}>
                    {dayOffset > 0
                      ? t('addTrip.arrivesDaysLater', { count: dayOffset })
                      : t('addTrip.arrivesDaysEarlier', {
                          count: Math.abs(dayOffset),
                        })}
                  </Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
