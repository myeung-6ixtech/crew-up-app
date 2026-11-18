import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { formatAirportDate, formatAirportTimeWithZone } from '@/lib/airportTime';
import { formatDuration, type Layover, type LayoverSummary } from '@/lib/layovers';
import { fontFamily, useTheme } from '@/theme';

/** "5:35 PM GMT+9" → ["5:35 PM", "GMT+9"]: the time in ink, the zone after it. */
function splitZone(iso: string, code: string | null) {
  const label = formatAirportTimeWithZone(iso, code);
  const index = label.lastIndexOf(' ');
  return index > 0 ? [label.slice(0, index), label.slice(index + 1)] : [label, ''];
}

/** "Wed 14 – Thu 15 Oct" (or "Fri 30 Oct – Sun 1 Nov"), in the airport's local days. */
export function layoverDates(layover: Layover) {
  const code = layover.airportIata;
  const part = (iso: string, options: Intl.DateTimeFormatOptions) => formatAirportDate(iso, code, options);
  const day = (iso: string) => `${part(iso, { weekday: 'short' })} ${part(iso, { day: 'numeric' })}`;
  const startMonth = part(layover.startsAt, { month: 'short' });
  const endMonth = part(layover.endsAt, { month: 'short' });
  const sameDay = day(layover.startsAt) === day(layover.endsAt) && startMonth === endMonth;
  if (sameDay) return `${day(layover.startsAt)} ${startMonth}`;
  return startMonth === endMonth
    ? `${day(layover.startsAt)} – ${day(layover.endsAt)} ${endMonth}`
    : `${day(layover.startsAt)} ${startMonth} – ${day(layover.endsAt)} ${endMonth}`;
}

/** Ink card: total free time ahead, across how many layovers, and the longest. */
export function FreeTimeSummaryCard({ summary }: { summary: LayoverSummary }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const dark = theme.mode === 'dark';
  return (
    <View
      accessible
      accessibilityLabel={[
        t('trips.freeTimeAhead'),
        `${formatDuration(summary.totalMinutes)} ${t('trips.acrossLayovers', { count: summary.count })}`,
        summary.longest ? t('trips.longest', { city: summary.longest.city, duration: formatDuration(summary.longest.minutes) }) : null,
      ]
        .filter(Boolean)
        .join('. ')}
      style={{ backgroundColor: dark ? theme.colors.card : '#0E1113', borderRadius: 20, padding: 18, gap: 6 }}>
      <MonoLabel style={{ fontSize: 10.5, color: '#A7B1B5' }}>{t('trips.freeTimeAhead')}</MonoLabel>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8 }}>
        <Text style={{ fontFamily: fontFamily.jakartaExtraBold, fontSize: 34, letterSpacing: -0.8, color: '#A8E05F' }}>
          {formatDuration(summary.totalMinutes)}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: '#EDF1F2' }}>{t('trips.acrossLayovers', { count: summary.count })}</Text>
      </View>
      {summary.longest ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: '#A7B1B5' }}>
          {t('trips.longest', { city: summary.longest.city, duration: formatDuration(summary.longest.minutes) })}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * One layover: city and airport, local dates, the free duration, a bar against the longest upcoming layover, then
 * landed / free-until in the airport's zone. A connection under an hour shows minutes only, with no bar.
 */
export function LayoverCard({ layover, longestMinutes, onPress }: { layover: Layover; longestMinutes: number; onPress?: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [landTime, landZone] = splitZone(layover.startsAt, layover.airportIata);
  const [untilTime, untilZone] = splitZone(layover.endsAt, layover.airportIata);
  const duration = formatDuration(layover.minutes);
  const dates = layoverDates(layover);
  const share = longestMinutes > 0 ? Math.max(0.04, Math.min(1, layover.minutes / longestMinutes)) : 0;
  const small = { fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary };
  const strong = { fontFamily: fontFamily.interSemiBold, color: theme.colors.textPrimary };

  const label = t('trips.layoverA11y', {
    city: layover.city,
    dates,
    duration,
    lands: `${landTime} ${landZone}`.trim(),
    until: `${untilTime} ${untilZone}`.trim(),
  });
  const card = (
    <View
      accessible={!onPress}
      accessibilityLabel={onPress ? undefined : label}
      style={{ backgroundColor: theme.colors.card, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flexShrink: 1, gap: 3 }}>
          <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 18, color: theme.colors.textPrimary }}>
            {layover.city}
            {layover.airportIata ? (
              <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.textTertiary }}>{`  ${layover.airportIata}`}</Text>
            ) : null}
          </Text>
          <Text style={small}>{dates}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text
            style={{
              fontFamily: layover.short ? fontFamily.jakartaBold : fontFamily.jakartaExtraBold,
              fontSize: layover.short ? 16 : 22,
              letterSpacing: -0.4,
              color: layover.short ? theme.colors.textSecondary : theme.colors.textPrimary,
            }}>
            {duration}
          </Text>
          <MonoLabel style={{ fontSize: 9.5, color: layover.short ? theme.colors.textTertiary : theme.colors.accentText }}>
            {layover.short ? t('trips.connection') : t('trips.free')}
          </MonoLabel>
        </View>
      </View>
      {layover.short ? null : (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.mode === 'dark' ? theme.colors.track : '#EEF0EA', overflow: 'hidden' }}>
          <View style={{ width: `${share * 100}%`, height: 8, borderRadius: 4, backgroundColor: theme.colors.fill }} />
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={small}>
          {`${t('trips.lands')} `}
          <Text style={strong}>{landTime}</Text>
          {landZone ? ` ${landZone}` : ''}
        </Text>
        <Text style={small}>
          {`${t('trips.freeUntilShort')} `}
          <Text style={strong}>{untilTime}</Text>
          {untilZone ? ` ${untilZone}` : ''}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return card;
  // Opens the layover's detail page (who's there, the overlap, Find crew).
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      {card}
    </Pressable>
  );
}
