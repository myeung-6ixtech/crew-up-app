import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BodyText, NumericText } from '@/components/ui';
import type { FlightOption } from '@/types/flight';
import { formatDateTime } from '@/lib/utils';
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
      borderColor: t.colors.accent,
      backgroundColor: t.colors.accentSubtle,
    },
    topLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
      marginBottom: t.spacing.xs,
    },
    flightNumber: {
      color: t.colors.textPrimary,
    },
    flightNumberSelected: {
      color: t.colors.accent,
    },
    route: {
      marginBottom: t.spacing.xs,
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
            <NumericText style={styles.route}>
              {flight.departureAirport} → {flight.arrivalAirport}
            </NumericText>
            <BodyText muted>
              {formatDateTime(flight.departureTime)} → {formatDateTime(flight.arrivalTime)}
            </BodyText>
          </Pressable>
        );
      })}
    </View>
  );
}
