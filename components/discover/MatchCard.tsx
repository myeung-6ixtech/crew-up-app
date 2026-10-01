import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CrewAvatar, LimePills } from '@/components/crew/kit';
import { personName, personRoleBase } from '@/components/crew/people';
import { hapticImpact } from '@/lib/haptics';
import { fontFamily, shouldUppercaseLabels, useTheme } from '@/theme';
import type { TripMatchEntry } from '@/types/trip';
import { LONG_REST_HOURS, matchCityName, overlapHours, overlapLabel, overlapWindow } from './matches';

const REASON_TONES = {
  same_flight: { bg: '#0E1113', fg: '#A8E05F' },
  same_route: { bg: '#EAECE5', fg: '#0E1113' },
  layover_overlap: { bg: '#EEF7DF', fg: '#2F4210' },
} as const;

export function matchReason(match: TripMatchEntry, t: (key: string, options?: Record<string, string>) => string) {
  if (match.match_type === 'same_flight') return t('discover.reasonFlight');
  if (match.match_type === 'same_route') return t('discover.reasonRoute');
  return t('discover.reasonCity', { city: matchCityName(match) });
}

/** One person per row: reason chip, role · base, Wave, then the overlap window and how long it is. */
export function MatchCard({
  match,
  waved,
  waving,
  onWave,
  onPress,
  sharedTags,
}: {
  match: TripMatchEntry;
  waved: boolean;
  waving: boolean;
  onWave: () => void;
  onPress: () => void;
  sharedTags?: string[];
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const profile = match.matchedUser?.profile;
  const name = personName(profile, t('home.crewMember'));
  const tone = REASON_TONES[match.match_type];
  const hours = overlapHours(match);
  const window = overlapWindow(match);
  const upper = shouldUppercaseLabels();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${matchReason(match, t)}`}
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: theme.colors.card, borderRadius: 20, padding: 14, gap: 10, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CrewAvatar name={name} fileId={profile?.avatar_file_id} seed={match.matched_user_id} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
              {name}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.monoMedium,
                fontSize: 10,
                letterSpacing: 0.5,
                backgroundColor: tone.bg,
                color: tone.fg,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 9,
                overflow: 'hidden',
                textTransform: upper ? 'uppercase' : 'none',
              }}>
              {matchReason(match, t)}
            </Text>
          </View>
          {personRoleBase(profile, t) ? (
            <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
              {personRoleBase(profile, t)}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={waved ? t('discover.waved') : t('home.wave')}
          accessibilityState={{ disabled: waved, busy: waving }}
          disabled={waved || waving}
          onPress={() => {
            hapticImpact();
            onWave();
          }}
          style={({ pressed }) => ({
            height: 36,
            minWidth: 64,
            paddingHorizontal: 14,
            borderRadius: 18,
            backgroundColor: waved ? theme.colors.field : theme.colors.fill,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}>
          {waving ? (
            <ActivityIndicator color={theme.colors.onFill} />
          ) : (
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13, color: waved ? theme.colors.textSecondary : theme.colors.onFill }}>
              {waved ? t('discover.waved') : t('home.wave')}
            </Text>
          )}
        </Pressable>
      </View>
      {window ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            backgroundColor: theme.colors.ground,
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 10,
          }}>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.textPrimary }}>
            {window}
          </Text>
          {hours !== null ? (
            <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: hours >= LONG_REST_HOURS ? theme.colors.accentText : '#9B5B00' }}>
              {t('discover.overlap', { duration: overlapLabel(hours) })}
            </Text>
          ) : null}
        </View>
      ) : null}
      {sharedTags?.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 11.5, color: theme.colors.textTertiary }}>{t('discover.bothLike')}</Text>
          <LimePills names={sharedTags.slice(0, 3)} />
        </View>
      ) : null}
    </Pressable>
  );
}
