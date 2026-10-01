import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CrewAvatar, PushedTopBar } from '@/components/crew/kit';
import { personName } from '@/components/crew/people';
import { isCurrent, overlapLabel } from '@/components/discover/matches';
import { StandaloneNavPill } from '@/components/navigation/FloatingTabBar';
import { Screen } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { MonoLabel, PillCta } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatAirportDate, formatAirportTime } from '@/lib/airportTime';
import { dedupeTripMatches, fetchMyTrips, fetchTripMatches } from '@/services/tripService';
import { fontFamily, useTheme } from '@/theme';
import type { TripEntry, TripMatchEntry } from '@/types/trip';

const WINDOW_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false };

/** A saved layover: the rest window, who already overlaps, and search pre-filled with this city and these dates. */
export default function SavedLayoverScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [trip, setTrip] = useState<TripEntry | null | undefined>(undefined);
  const [matches, setMatches] = useState<TripMatchEntry[]>([]);

  const load = useCallback(async () => {
    if (!userId || !tripId) return;
    const [trips, allMatches] = await Promise.all([fetchMyTrips(client, userId), fetchTripMatches(client).catch(() => [])]);
    setTrip(trips.all.find((item) => item.id === tripId) ?? null);
    setMatches(dedupeTripMatches(allMatches.filter((match) => match.source_trip_id === tripId && isCurrent(match))));
  }, [client, tripId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stay = trip?.stays?.[0];
  const code = stay?.airport_iata ?? null;
  const city = stay ? (findAirportByIata(code)?.city ?? stay.city) : '';
  const arrival = trip?.flightLegs?.[0]?.flight;
  const restHours = stay ? (new Date(stay.ends_at).getTime() - new Date(stay.starts_at).getTime()) / 3_600_000 : 0;

  // How much of this rest someone else is free for: from the earliest overlap start to the latest end.
  const coverage = useMemo(() => {
    if (!stay || !matches.length) return null;
    const start = new Date(stay.starts_at).getTime();
    const span = new Date(stay.ends_at).getTime() - start;
    if (span <= 0) return null;
    const starts = matches.map((match) => new Date(match.overlap_start ?? stay.starts_at).getTime());
    const ends = matches.map((match) => new Date(match.overlap_end ?? stay.ends_at).getTime());
    const left = Math.max(0, (Math.min(...starts) - start) / span);
    const right = Math.min(1, (Math.max(...ends) - start) / span);
    return { left, width: Math.max(0.04, right - left) };
  }, [matches, stay]);

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar title={t('discover.yourLayover')} onBack={() => router.back()} />
      </View>
      {trip === undefined ? (
        <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 80 }} />
      ) : !trip || !stay ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 80, paddingHorizontal: 24 }}>
          {t('discover.layoverMissing')}
        </Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 120 }}>
          <View style={{ backgroundColor: '#0E1113', borderRadius: 24, padding: 20, marginTop: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <MonoLabel style={{ fontSize: 10.5, color: '#7D878B' }}>{t('discover.layoverSaved')}</MonoLabel>
              {restHours > 0 ? <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: '#A8E05F' }}>{overlapLabel(restHours)}</Text> : null}
            </View>
            <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 30, letterSpacing: -0.75, color: '#EDF1F2' }}>
              {city}
            </Text>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: '#A7B1B5' }}>
              {`${formatAirportDate(stay.starts_at, code, WINDOW_FORMAT)} – ${formatAirportDate(stay.ends_at, code, WINDOW_FORMAT)}${code ? ` · ${t('discover.localTime', { code })}` : ''}`}
            </Text>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: '#2C3134', marginTop: 4 }}>
              {coverage ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${coverage.left * 100}%`,
                    width: `${coverage.width * 100}%`,
                    borderRadius: 4,
                    backgroundColor: '#A8E05F',
                  }}
                />
              ) : null}
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <PillCta
              label={t('discover.findOnLayover')}
              onPress={() => router.push(SCREENS.discover.search({ city: code ?? stay.city, from: stay.starts_at, to: stay.ends_at }))}
            />
          </View>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 8 }}>
            {t('discover.findOnLayoverHint', { city })}
          </Text>

          {matches.length ? (
            <>
              <MonoLabel style={{ fontSize: 10.5, marginTop: 24 }}>{t('discover.alreadyOverlapping')}</MonoLabel>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <View style={{ flexDirection: 'row' }}>
                  {matches.slice(0, 3).map((match, index) => (
                    <View
                      key={match.id}
                      style={{
                        marginRight: index < Math.min(matches.length, 3) - 1 ? -10 : 0,
                        borderWidth: 2,
                        borderColor: theme.colors.ground,
                        borderRadius: 20,
                      }}>
                      <CrewAvatar
                        size={36}
                        name={personName(match.matchedUser?.profile)}
                        fileId={match.matchedUser?.profile?.avatar_file_id}
                        seed={match.matched_user_id}
                      />
                    </View>
                  ))}
                </View>
                <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textPrimary }}>
                  <Text style={{ fontFamily: fontFamily.interMedium }}>{t('discover.crewCount', { count: matches.length })}</Text>{' '}
                  {t('discover.freeWithYou', { city })}
                </Text>
              </View>
            </>
          ) : null}

          <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, paddingVertical: 4, paddingHorizontal: 16, marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline }}>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>{t('discover.arrives')}</Text>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>
                {[arrival?.flight_number, formatAirportTime(arrival?.scheduled_arrival ?? stay.starts_at, code)].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>{t('discover.freeUntil')}</Text>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>{formatAirportTime(stay.ends_at, code)}</Text>
            </View>
          </View>
        </ScrollView>
      )}
      <StandaloneNavPill active="index" />
    </Screen>
  );
}
