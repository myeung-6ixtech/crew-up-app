import { Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AirlineMark, type AirlineInfo } from '@/components/crew/airline';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { TripMatchEntry } from '@/types/trip';

/** Off-state track for the airline switch (the design's grey). */
const TRACK_OFF = '#D4D8CD';

/** Crossing-paths matches limited to your airline. */
export function onlyAirline(matches: TripMatchEntry[], airlineId: string | null | undefined) {
  return airlineId ? matches.filter((match) => match.matchedUser?.profile?.airline_id === airlineId) : matches;
}

/** "YOUR AIRLINE ONLY", your airline's logo and name, and the switch (the app's standard toggle) that narrows the list. */
export function MyAirlineCard({ airline, active, onToggle }: { airline: AirlineInfo; active: boolean; onToggle: (next: boolean) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const short = airline.name.split(' ')[0];
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
        <MonoLabel style={{ fontSize: 9.5, color: theme.colors.textTertiary }}>{t('discover.yourAirlineOnly')}</MonoLabel>
        <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: theme.colors.textPrimary }}>
          {airline.name}
        </Text>
        <Text numberOfLines={2} style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textSecondary }}>
          {active ? t('discover.airlineFilterOn', { airline: short }) : t('discover.airlineFilterOff')}
        </Text>
      </View>
      {/* Native switch: 51×31 on iOS, role "switch", announces on/off. */}
      <Switch
        accessibilityLabel={t('discover.airlineFilterA11y', { airline: short })}
        value={active}
        onValueChange={(next) => {
          hapticSelection();
          onToggle(next);
        }}
        trackColor={{ true: theme.colors.fill, false: TRACK_OFF }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={TRACK_OFF}
      />
    </View>
  );
}
