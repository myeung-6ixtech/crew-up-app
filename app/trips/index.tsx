import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { BackGlyph, CircleButton } from '@/components/crew/kit';
import { PlaneGlyph } from '@/components/roster/flowKit';
import { NoTripsCard, TripCard, stayCity } from '@/components/roster/TripCard';
import { FreeTimeSummaryCard, LayoverCard } from '@/components/trips/LayoverCards';
import { Screen, Toast } from '@/components/ui';
import { SegmentedSwitch } from '@/components/ui/SegmentedSwitch';
import { SCREENS } from '@/constants/screens';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { useAddTripFlow } from '@/hooks/useAddTripFlow';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { summarizeLayovers, upcomingLayovers } from '@/lib/layovers';
import { deactivateTrip, fetchTripHistory } from '@/services/tripService';
import { fontFamily, useTheme } from '@/theme';
import { tripFlight, type TripEntry } from '@/types/trip';

type TripsView = 'trips' | 'layovers';

/** The last view picked, for the rest of the session (frames 5A / 5B). Trips by default. */
let lastView: TripsView = 'trips';
const PAST_PAGE = 5;

const departureMs = (trip: TripEntry) => Date.parse(tripFlight(trip)?.scheduled_departure ?? trip.starts_at ?? '') || 0;

/**
 * Your trips (Turn 5): one schedule, two ways. Trips (5A) lists flights, upcoming then past; Layovers (5B) shows the
 * free time on the ground worked out from the same trips. Removing a trip updates both at once; Home reloads its counts
 * when you go back.
 */
export default function TripsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const { openAddTrip, addTripMethodOverlay } = useAddTripFlow();
  // Home's Cities count opens straight on Layovers; otherwise the last view picked this session.
  const { view: requestedView } = useLocalSearchParams<{ view?: string }>();
  const [view, setViewState] = useState<TripsView>(() => {
    if (requestedView === 'layovers' || requestedView === 'trips') lastView = requestedView;
    return lastView;
  });
  const [upcoming, setUpcoming] = useState<TripEntry[]>([]);
  const [past, setPast] = useState<TripEntry[]>([]);
  const [pastShown, setPastShown] = useState(PAST_PAGE);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  // Each view keeps its own scroll position, so switching back returns where you were.
  const offsets = useRef<Record<TripsView, number>>({ trips: 0, layovers: 0 });

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await fetchTripHistory(client, userId);
      setUpcoming(result.upcoming);
      setPast(result.past);
    } finally {
      setLoading(false);
    }
  }, [client, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const setView = (next: TripsView) => {
    lastView = next;
    setViewState(next);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: offsets.current[next], animated: false }));
  };

  const remove = (trip: TripEntry) => {
    hapticWarning();
    Alert.alert(t('trips.removeTitle'), t('trips.removeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('trips.removeTrip'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivateTrip(client, trip.id);
            hapticSuccess();
            // Both views read this list, so the card, its layover and the totals go together.
            setUpcoming((current) => current.filter((item) => item.id !== trip.id));
            setToast(t('trips.removedToast'));
          } catch {
            hapticError();
            setToast(t('onboarding.genericError'));
          }
        },
      },
    ]);
  };

  const upcomingSorted = useMemo(() => upcoming.slice().sort((a, b) => departureMs(a) - departureMs(b)), [upcoming]);
  const pastSorted = useMemo(() => past.slice().sort((a, b) => departureMs(b) - departureMs(a)), [past]);
  const layovers = useMemo(
    () => upcomingLayovers(upcoming, { cityFor: (city, iata) => stayCity({ city: city ?? iata ?? '', airport_iata: iata }) }),
    [upcoming],
  );
  const summary = useMemo(() => summarizeLayovers(layovers), [layovers]);
  const noTrips = !loading && !upcoming.length && !past.length;

  const openTrip = (trip: TripEntry) => (trip.stays?.length ? () => router.push(SCREENS.discover.layover(trip.id)) : undefined);
  const sectionLabel = (text: string) => <MonoLabel style={{ fontSize: 10.5, letterSpacing: 1.26, color: theme.mode === 'dark' ? theme.colors.textTertiary : '#545A50' }}>{text}</MonoLabel>;

  const tripsView = () => (
    <>
      {upcomingSorted.length ? (
        <View style={{ gap: 12 }}>
          {sectionLabel(t('trips.upcomingCount', { count: upcomingSorted.length }))}
          {upcomingSorted.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={openTrip(trip)} onRemove={() => remove(trip)} />
          ))}
        </View>
      ) : (
        <NoTripsCard icon={<PlaneGlyph color={theme.colors.textSecondary} />} />
      )}
      {pastSorted.length ? (
        <View style={{ gap: 12 }}>
          {sectionLabel(t('trips.pastSection'))}
          {pastSorted.slice(0, pastShown).map((trip) => (
            <TripCard key={trip.id} trip={trip} past />
          ))}
          {pastSorted.length > pastShown ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setPastShown((count) => count + PAST_PAGE)}
              style={({ pressed }) => ({ alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18, opacity: pressed ? 0.6 : 1 })}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary }}>{t('trips.showMore')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </>
  );

  const layoversView = () =>
    layovers.length ? (
      <>
        <FreeTimeSummaryCard summary={summary} />
        <View style={{ gap: 12 }}>
          {sectionLabel(t('trips.upcomingCount', { count: layovers.length }))}
          {layovers.map((layover) => (
            <LayoverCard
              key={layover.id}
              layover={layover}
              longestMinutes={summary.longest?.minutes ?? 0}
              // Saved layovers open their detail page, like the trip cards' "Free until …". A gap worked out from the
              // next departure has no saved stay for that page to show, so it isn't a link.
              onPress={layover.derived ? undefined : () => router.push(SCREENS.discover.layover(layover.tripId))}
            />
          ))}
        </View>
      </>
    ) : upcoming.length ? (
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 28 }}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>{t('trips.noLayovers')}</Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 260 }}>
          {t('trips.noLayoversBody')}
        </Text>
      </View>
    ) : (
      <NoTripsCard icon={<PlaneGlyph color={theme.colors.textSecondary} />} />
    );

  return (
    <Screen style={{ padding: 0 }}>
      {addTripMethodOverlay}
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 }}>
        <CircleButton tone="card" accessibilityLabel={t('common.back')} onPress={() => router.back()}>
          <BackGlyph color={theme.colors.textPrimary} />
        </CircleButton>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('discover.addTrip')}
          onPress={openAddTrip}
          style={({ pressed }) => ({
            height: 40,
            borderRadius: 20,
            paddingHorizontal: 16,
            backgroundColor: pressed ? theme.colors.accentPressed : theme.colors.fill,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          })}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 18, lineHeight: 20, color: theme.colors.onFill }}>+</Text>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.onFill }}>{t('discover.addTrip')}</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={32}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          offsets.current[view] = event.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32, gap: 18 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 28, letterSpacing: -0.6, color: theme.colors.textPrimary }}>
          {t('trips.yourTrips')}
        </Text>
        <SegmentedSwitch
          options={[
            { value: 'trips', label: t('trips.viewTrips') },
            { value: 'layovers', label: t('trips.viewLayovers') },
          ]}
          value={view}
          onChange={setView}
        />
        {loading ? (
          <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 32 }} />
        ) : noTrips ? (
          <NoTripsCard icon={<PlaneGlyph color={theme.colors.textSecondary} />} />
        ) : view === 'trips' ? (
          tripsView()
        ) : (
          layoversView()
        )}
      </ScrollView>
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
    </Screen>
  );
}
