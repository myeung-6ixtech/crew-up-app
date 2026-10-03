import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { findAirportByIata } from '@/constants/airports';
import { TextAction } from '@/features/onboarding/components/kit';
import { airportDayOffset, formatAirportDate, formatAirportTimeWithZone } from '@/lib/airportTime';
import { fontFamily, shouldUppercaseLabels, useTheme } from '@/theme';
import { tripFlight, tripRouteLabel, type TripEntry } from '@/types/trip';

function titleCase(value: string) {
  return value.toLowerCase().replace(/(^|\s|-)\S/g, (match) => match.toUpperCase());
}

/** City for a stay: the airport's city when known, otherwise the stored name in title case. */
export function stayCity(stay: { city: string; airport_iata?: string | null }) {
  return findAirportByIata(stay.airport_iata)?.city ?? titleCase(stay.city);
}

function Clock({ iso, code }: { iso: string; code: string | null }) {
  const theme = useTheme();
  const label = formatAirportTimeWithZone(iso, code);
  const index = label.lastIndexOf(' ');
  const [time, zone] = index > 0 ? [label.slice(0, index), label.slice(index + 1)] : [label, ''];
  return (
    <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, color: theme.colors.textPrimary }}>
      {time} <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: theme.colors.textTertiary }}>{zone}</Text>
    </Text>
  );
}

/** A saved trip: flight and route with a status dot, local times with zones, then the free window. */
export function TripCard({
  trip,
  matchCount,
  onPress,
  onRemove,
}: {
  trip: TripEntry;
  matchCount?: number;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const flight = tripFlight(trip);
  const stay = trip.stays?.[0];
  const title = flight ? `${flight.flight_number} · ${flight.departure_airport} → ${flight.arrival_airport}` : stay ? stayCity(stay) : tripRouteLabel(trip);
  const dateIso = flight?.scheduled_departure ?? stay?.starts_at ?? trip.starts_at;
  const dateCode = flight?.departure_airport ?? stay?.airport_iata ?? null;
  const dateLabel = dateIso ? formatAirportDate(dateIso, dateCode, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const dayOffset = flight
    ? airportDayOffset(flight.scheduled_departure, flight.departure_airport, flight.scheduled_arrival, flight.arrival_airport)
    : 0;

  const body = (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.fill, borderWidth: 3, borderColor: theme.colors.accentSubtle, padding: 0 }} />
          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>
            {title}
          </Text>
        </View>
        {dateLabel ? (
          <Text
            style={{
              fontFamily: fontFamily.monoMedium,
              fontSize: 10.5,
              color: theme.colors.textSecondary,
              textTransform: shouldUppercaseLabels() ? 'uppercase' : 'none',
            }}>
            {dateLabel}
          </Text>
        ) : null}
      </View>
      {flight ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Clock iso={flight.scheduled_departure} code={flight.departure_airport} />
          <View style={{ flex: 1, height: 1.5, backgroundColor: theme.colors.track }} />
          <Clock iso={flight.scheduled_arrival} code={flight.arrival_airport} />
          {dayOffset !== 0 ? (
            <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10, color: theme.colors.accentText }}>{dayOffset > 0 ? `+${dayOffset}` : dayOffset}</Text>
          ) : null}
        </View>
      ) : null}
      {stay || onRemove ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            borderTopWidth: flight ? 1 : 0,
            borderTopColor: theme.colors.hairline,
            paddingTop: flight ? 12 : 0,
          }}>
          {stay ? (
            <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.accentText }}>
              {t('trips.freeUntilIn', {
                time: formatAirportTimeWithZone(stay.ends_at, stay.airport_iata ?? null).split(' ')[0],
                city: stayCity(stay),
              })}
            </Text>
          ) : (
            <View />
          )}
          {onRemove ? (
            <TextAction label={t('trips.removeTrip')} onPress={onRemove} style={{ fontSize: 12.5, color: theme.colors.textSecondary }} />
          ) : matchCount !== undefined ? (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>
              {matchCount ? t('trips.matchCount', { count: matchCount }) : t('trips.findingMatches')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      {body}
    </Pressable>
  );
}

/** Dashed empty state for What's next and Your trips. */
export function NoTripsCard({ icon }: { icon: React.ReactNode }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View
      style={{
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#C9CEC1',
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        gap: 12,
      }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>{t('home.emptyTrips')}</Text>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 250 }}>
        {t('home.emptyTripsBody')}
      </Text>
    </View>
  );
}
