import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { airportDayOffset, formatAirportDate, formatAirportTimeWithZone } from '@/lib/airportTime';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { FlightOption } from '@/types/flight';
import { PlaneGlyph } from './flowKit';

/** "07:45 GST" → ["07:45", "GST"], so the zone can be set small. */
function splitZone(label: string) {
  const index = label.lastIndexOf(' ');
  return index > 0 ? [label.slice(0, index), label.slice(index + 1)] : [label, ''];
}

function Endpoint({ code, iso, alignEnd }: { code: string; iso: string; alignEnd?: boolean }) {
  const theme = useTheme();
  const [time, zone] = splitZone(formatAirportTimeWithZone(iso, code));
  return (
    <View style={{ gap: 1, alignItems: alignEnd ? 'flex-end' : 'flex-start' }}>
      <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.textSecondary }}>{code}</Text>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 21, color: theme.colors.textPrimary }}>
        {time} <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10, color: theme.colors.textTertiary }}>{zone}</Text>
      </Text>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 11.5, color: theme.colors.textTertiary }}>
        {formatAirportDate(iso, code, { day: 'numeric', month: 'short' })}
      </Text>
    </View>
  );
}

/** One departure: flight and airline, local times at each airport with zones, and a day-change chip. */
export function FlightOptionCard({ flight, selected, onPress }: { flight: FlightOption; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const dayOffset = airportDayOffset(flight.departureTime, flight.departureAirport, flight.arrivalTime, flight.arrivalAirport);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${flight.flightNumber}, ${flight.airline}`}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={({ pressed }) => ({
        borderRadius: 20,
        backgroundColor: selected ? '#F4FAEA' : theme.colors.card,
        borderWidth: 2,
        borderColor: selected ? theme.colors.fill : theme.colors.card,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 10,
        opacity: pressed ? 0.9 : 1,
      })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: theme.colors.textPrimary }}>{flight.flightNumber}</Text>
        <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>
          {flight.airline}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Endpoint code={flight.departureAirport} iso={flight.departureTime} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flex: 1, height: 1.5, backgroundColor: '#C9CEC1' }} />
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <PlaneGlyph color={theme.colors.textSecondary} size={16} />
          </View>
          <View style={{ flex: 1, height: 1.5, backgroundColor: '#C9CEC1' }} />
        </View>
        <Endpoint code={flight.arrivalAirport} iso={flight.arrivalTime} alignEnd />
      </View>
      {dayOffset !== 0 ? (
        <MonoLabel
          style={{
            alignSelf: 'flex-start',
            fontSize: 10.5,
            color: theme.colors.accentText,
            backgroundColor: theme.colors.accentSubtle,
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 10,
            overflow: 'hidden',
          }}>
          {dayOffset > 0 ? t('addTrip.arrivesDaysLater', { count: dayOffset }) : t('addTrip.arrivesDaysEarlier', { count: Math.abs(dayOffset) })}
        </MonoLabel>
      ) : null}
    </Pressable>
  );
}
