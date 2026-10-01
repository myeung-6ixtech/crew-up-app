import { Pressable, Text, View } from 'react-native';
import type { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { fontFamily, useTheme } from '@/theme';
import type { TripMatchEntry } from '@/types/trip';
import { matchReason } from './MatchCard';
import { matchCityName, overlapHours, overlapLabel, overlapWindow } from './matches';

/** Opens their profile with Wave, and the overlap shown in a lime card. */
export function openMatchProfile(router: ReturnType<typeof useRouter>, match: TripMatchEntry, t: TFunction) {
  const hours = overlapHours(match);
  const route = match.departure_airport && match.arrival_airport ? `${match.departure_airport} → ${match.arrival_airport}` : null;
  router.push({
    pathname: '/network/[userId]',
    params: {
      userId: match.matched_user_id,
      wave: '1',
      matchLabel: matchReason(match, t),
      matchTitle: [match.flight_number, route].filter(Boolean).join(' · ') || matchCityName(match),
      matchDetail: [overlapWindow(match), hours !== null ? t('discover.overlap', { duration: overlapLabel(hours) }) : null]
        .filter(Boolean)
        .join(' · '),
    },
  });
}

/** Dashed airport chips over a title, a line and one action: no trips yet, or discovery switched off. */
export function DiscoverEmpty({
  title,
  body,
  actionLabel,
  onAction,
  tone,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  tone: 'lime' | 'outline';
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 64, paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {['HKG', 'NRT', 'SIN'].map((code) => (
          <Text
            key={code}
            style={{
              fontFamily: fontFamily.monoMedium,
              fontSize: 11,
              color: theme.colors.textTertiary,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#C9CEC1',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}>
            {code}
          </Text>
        ))}
      </View>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 19, lineHeight: 24, color: theme.colors.textPrimary, textAlign: 'center', marginTop: 6 }}>
        {title}
      </Text>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary, textAlign: 'center' }}>
        {body}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        style={({ pressed }) => ({
          marginTop: 6,
          height: 48,
          borderRadius: 24,
          paddingHorizontal: 18,
          backgroundColor: tone === 'lime' ? theme.colors.fill : 'transparent',
          borderWidth: tone === 'outline' ? 1.5 : 0,
          borderColor: '#C9CEC1',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.onFill }}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
