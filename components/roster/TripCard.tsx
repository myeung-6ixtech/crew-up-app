import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { findAirportByIata } from '@/constants/airports';
import { TextAction } from '@/features/onboarding/components/kit';
import { airportDateKey, airportDayOffset, formatAirportDate, formatAirportTime, formatAirportTimeWithZone } from '@/lib/airportTime';
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

/** "Free until 2:30 PM" plus the weekday when the free time ends on a later local day than it began. */
function freeUntilLabel(stay: NonNullable<TripEntry['stays']>[number], always = false) {
  const code = stay.airport_iata ?? null;
  const time = formatAirportTime(stay.ends_at, code);
  const sameDay = airportDateKey(stay.starts_at, code) === airportDateKey(stay.ends_at, code);
  return always || !sameDay ? `${time} ${formatAirportDate(stay.ends_at, code, { weekday: 'short' })}` : time;
}

/** "Flight EK318, Dubai to Tokyo, Wednesday 14 October, departs 2:55 AM, arrives 5:35 PM" for screen readers. */
function tripSpokenLabel(trip: TripEntry, t: (key: string, options?: Record<string, unknown>) => string) {
  const flight = tripFlight(trip);
  const stay = trip.stays?.[0];
  if (!flight) return stay ? stayCity(stay) : tripRouteLabel(trip);
  const from = findAirportByIata(flight.departure_airport)?.city ?? flight.departure_airport;
  const to = findAirportByIata(flight.arrival_airport)?.city ?? flight.arrival_airport;
  return t('trips.flightA11y', {
    flight: flight.flight_number,
    from,
    to,
    date: formatAirportDate(flight.scheduled_departure, flight.departure_airport, { weekday: 'long', day: 'numeric', month: 'long' }),
    departs: formatAirportTime(flight.scheduled_departure, flight.departure_airport),
    arrives: formatAirportTime(flight.scheduled_arrival, flight.arrival_airport),
  });
}

/**
 * A saved trip: flight and route with a status dot, local times with zones, then the free window.
 * `past` dims it, greys the dot and reads "Was free until …"; past trips can't be removed.
 */
export function TripCard({
  trip,
  matchCount,
  onPress,
  onRemove,
  past = false,
}: {
  trip: TripEntry;
  matchCount?: number;
  onPress?: () => void;
  onRemove?: () => void;
  past?: boolean;
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
  const removeColor = theme.mode === 'dark' ? '#FF7A66' : '#B23A26';
  const spoken = tripSpokenLabel(trip, t);

  const body = (
    <View
      accessible={!onPress && !onRemove}
      accessibilityLabel={!onPress && !onRemove ? spoken : undefined}
      style={{ backgroundColor: theme.colors.card, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, gap: 12, opacity: past ? 0.62 : 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: past ? theme.colors.textTertiary : theme.colors.fill,
              borderWidth: 3,
              borderColor: past ? theme.colors.field : theme.colors.accentSubtle,
              padding: 0,
            }}
          />
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
      {stay || (onRemove && !past) ? (
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
            <Text
              numberOfLines={1}
              style={{ flexShrink: 1, fontFamily: fontFamily.interMedium, fontSize: 13, color: past ? theme.colors.textSecondary : theme.colors.accentText }}>
              {past
                ? t('trips.wasFreeUntilIn', { time: freeUntilLabel(stay, true), city: stayCity(stay) })
                : t('trips.freeUntilIn', { time: freeUntilLabel(stay), city: stayCity(stay) })}
            </Text>
          ) : (
            <View />
          )}
          {onRemove && !past ? (
            <TextAction label={t('trips.removeTrip')} onPress={onRemove} style={{ fontSize: 12.5, color: removeColor }} />
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
    <Pressable accessibilityRole="button" accessibilityLabel={spoken} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
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
