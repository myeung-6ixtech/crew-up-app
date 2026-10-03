import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PushedTopBar } from '@/components/crew/kit';
import { openMatchProfile } from '@/components/discover/DiscoverEmpty';
import { MatchCard } from '@/components/discover/MatchCard';
import { MyAirlineCard, airlineCounts } from '@/components/discover/MyAirlineCard';
import { useAirlines } from '@/components/crew/airline';
import { useAuth } from '@/hooks/useSession';
import {
  CLOSENESS_BY_TYPE,
  LONG_REST_HOURS,
  type Closeness,
  isCurrent,
  matchesPlace,
  overlapHours,
} from '@/components/discover/matches';
import { useWave } from '@/components/discover/useWave';
import { Screen, Toast } from '@/components/ui';
import { MonoLabel, SearchGlyph, TogglePill } from '@/features/onboarding/components/kit';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticSelection } from '@/lib/haptics';
import { dedupeTripMatches, fetchTripMatches } from '@/services/tripService';
import { fontFamily, useTheme } from '@/theme';
import type { TripMatchEntry } from '@/types/trip';

const CLOSENESS: Closeness[] = ['flight', 'route', 'city'];

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Search layovers: narrows the overlaps that saving a layover already computed.
 * A saved layover opens it with the city and its window filled in.
 */
export default function SearchLayoversScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const params = useLocalSearchParams<{ city?: string; from?: string; to?: string }>();
  const [all, setAll] = useState<TripMatchEntry[] | null>(null);
  const [query, setQuery] = useState(params.city ?? '');
  const [range, setRange] = useState<{ from: string; to: string } | null>(params.from && params.to ? { from: params.from, to: params.to } : null);
  const [closeness, setCloseness] = useState<Closeness[]>(CLOSENESS);
  const [longOnly, setLongOnly] = useState(false);
  const [toast, setToast] = useState('');
  const { waved, waving, wave } = useWave(setToast);
  const { profile } = useAuth();
  const airlines = useAirlines();
  const [airlineOnly, setAirlineOnly] = useState(false);
  const myAirline = profile?.airline_id ? airlines.get(profile.airline_id) : undefined;

  const load = useCallback(async () => {
    setAll(await fetchTripMatches(client).catch(() => []));
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const results = useMemo(() => {
    if (!all) return [];
    const from = range ? new Date(range.from).getTime() : null;
    const to = range ? new Date(range.to).getTime() : null;
    return dedupeTripMatches(
      all.filter((match) => {
        if (!isCurrent(match)) return false;
        if (!closeness.includes(CLOSENESS_BY_TYPE[match.match_type])) return false;
        if (!matchesPlace(match, query)) return false;
        if (airlineOnly && match.matchedUser?.profile?.airline_id !== profile?.airline_id) return false;
        const hours = overlapHours(match);
        if (longOnly && (hours === null || hours < LONG_REST_HOURS)) return false;
        if (from !== null && to !== null && match.overlap_start && match.overlap_end) {
          if (new Date(match.overlap_end).getTime() < from || new Date(match.overlap_start).getTime() > to) return false;
        }
        return true;
      }),
    );
  }, [airlineOnly, all, closeness, longOnly, profile?.airline_id, query, range]);

  const toggleCloseness = (value: Closeness) =>
    setCloseness((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));

  const whenLabel = range
    ? `${formatDay(range.from)} – ${formatDay(range.to)}`
    : query.trim()
      ? t('discover.whenSaved')
      : t('discover.whenAll');
  const resultLabel = [t('discover.people', { count: results.length }), query.trim().toUpperCase()].filter(Boolean).join(' · ');

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar title={t('discover.searchTitle')} onBack={() => router.back()} />
        <View style={{ gap: 10, paddingTop: 14, paddingHorizontal: 24 }}>
          <View
            style={{
              height: 50,
              borderRadius: 25,
              backgroundColor: theme.colors.card,
              borderWidth: 2,
              borderColor: theme.colors.ink,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 18,
            }}>
            <SearchGlyph color={theme.colors.textPrimary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus={!params.city}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={t('discover.cityPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              accessibilityLabel={t('discover.cityPlaceholder')}
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary, padding: 0 }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.colors.card,
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
            }}>
            <View style={{ gap: 1 }}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 11, color: theme.colors.textSecondary }}>{t('events.when')}</Text>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14.5, color: theme.colors.textPrimary }}>{whenLabel}</Text>
            </View>
            {range ? (
              <Text
                accessibilityRole="button"
                onPress={() => setRange(null)}
                style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.accentText }}>
                {t('discover.allDates')}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {CLOSENESS.map((value) => (
              <TogglePill
                key={value}
                size="sm"
                label={t(`discover.close.${value}`)}
                selected={closeness.includes(value)}
                onPress={() => toggleCloseness(value)}
              />
            ))}
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: longOnly }}
              onPress={() => {
                hapticSelection();
                setLongOnly((value) => !value);
              }}
              style={{
                height: 34,
                borderRadius: 17,
                paddingHorizontal: 13,
                backgroundColor: longOnly ? theme.colors.ink : theme.colors.card,
                borderWidth: 1.5,
                borderColor: longOnly ? theme.colors.ink : theme.colors.hairline,
                justifyContent: 'center',
              }}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: longOnly ? theme.colors.fill : theme.colors.textPrimary }}>
                {t('discover.longRests', { hours: LONG_REST_HOURS })}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}>
        {all === null ? (
          <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 40 }} />
        ) : results.length || airlineOnly ? (
          <>
            {myAirline ? (
              <MyAirlineCard
                airline={myAirline}
                {...airlineCounts(results, profile?.airline_id)}
                active={airlineOnly}
                onToggle={() => setAirlineOnly((value) => !value)}
              />
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14 }}>
              <MonoLabel style={{ fontSize: 10.5 }}>{resultLabel}</MonoLabel>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 11.5, color: theme.colors.textTertiary }}>{t('discover.strongestFirst')}</Text>
            </View>
            <View style={{ gap: 8, marginTop: 10 }}>
              {results.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  airline={match.matchedUser?.profile?.airline_id ? airlines.get(match.matchedUser.profile.airline_id) : null}
                  myAirline={Boolean(profile?.airline_id) && match.matchedUser?.profile?.airline_id === profile?.airline_id}
                  waved={waved.has(match.matched_user_id)}
                  waving={waving === match.matched_user_id}
                  onWave={() => void wave(match.matched_user_id)}
                  onPress={() => openMatchProfile(router, match, t)}
                />
              ))}
            </View>
          </>
        ) : (
          <View
            style={{
              marginTop: 14,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#C9CEC1',
              borderRadius: 20,
              paddingVertical: 24,
              paddingHorizontal: 20,
              alignItems: 'center',
              gap: 10,
            }}>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary, textAlign: 'center' }}>
              {t('discover.noneTitle')}
            </Text>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, textAlign: 'center' }}>
              {t('discover.noneBody')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setQuery('');
                setRange(null);
                setCloseness(CLOSENESS);
                setLongOnly(false);
              }}
              style={({ pressed }) => ({
                height: 40,
                borderRadius: 20,
                paddingHorizontal: 18,
                backgroundColor: '#0E1113',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13.5, color: '#A8E05F' }}>{t('discover.clearSearch')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
    </Screen>
  );
}
