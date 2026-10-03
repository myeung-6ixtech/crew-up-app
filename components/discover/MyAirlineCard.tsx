import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AirlineMark, type AirlineInfo } from '@/components/crew/airline';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { TripMatchEntry } from '@/types/trip';

/** Crossing-paths crew on your own airline, and how many share your flight. */
export function airlineCounts(matches: TripMatchEntry[], airlineId: string | null | undefined) {
  const same = airlineId ? matches.filter((match) => match.matchedUser?.profile?.airline_id === airlineId) : [];
  return { count: same.length, onFlight: same.filter((match) => match.match_type === 'same_flight').length };
}

/** Your airline's logo, the count, and a toggle that narrows the list to that airline. */
export function MyAirlineCard({
  airline,
  count,
  onFlight,
  active,
  onToggle,
}: {
  airline: AirlineInfo;
  count: number;
  onFlight: number;
  active: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const short = airline.name.split(' ')[0];
  const summary = [
    t('discover.airlineCount', { count, airline: short }),
    onFlight ? t('discover.onYourFlightCount', { count: onFlight }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View
      style={{
        marginTop: 16,
        backgroundColor: theme.colors.card,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
      <AirlineMark code={airline.code} size={44} />
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <MonoLabel style={{ fontSize: 9.5, color: theme.colors.textTertiary }}>{t('discover.yourAirline')}</MonoLabel>
        <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: theme.colors.textPrimary }}>
          {airline.name}
        </Text>
        <Text numberOfLines={2} style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textSecondary }}>
          {summary}
        </Text>
      </View>
      {count ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: active }}
          onPress={() => {
            hapticSelection();
            onToggle();
          }}
          style={({ pressed }) => ({
            height: 32,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: active ? '#0E1113' : theme.colors.fill,
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}>
          <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 12.5, color: active ? '#A8E05F' : theme.colors.onFill }}>
            {active ? t('discover.showingAirline', { airline: short }) : t('discover.airlineOnly', { airline: short })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
