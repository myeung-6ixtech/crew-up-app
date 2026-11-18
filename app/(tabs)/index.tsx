import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { CircleButton, CrewAvatar, MenuGlyph, RowChevron } from '@/components/crew/kit';
import { DiscoverEmpty, openMatchProfile } from '@/components/discover/DiscoverEmpty';
import { MatchCard } from '@/components/discover/MatchCard';
import { MyAirlineCard, onlyAirline } from '@/components/discover/MyAirlineCard';
import { MatchCardSkeleton } from '@/components/discover/MatchCardSkeleton';
import { useAirlineOnlyPreference } from '@/hooks/useAirlineOnlyPreference';
import { useAirlines } from '@/components/crew/airline';
import { isCurrent } from '@/components/discover/matches';
import { useWave } from '@/components/discover/useWave';
import { PlaneGlyph } from '@/components/roster/flowKit';
import { NoTripsCard, TripCard } from '@/components/roster/TripCard';
import { tripStats } from '@/lib/tripStats';
import { Screen, Skeleton, Toast } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { useAppMenu } from '@/contexts/AppMenuContext';
import { MonoLabel, SearchGlyph } from '@/features/onboarding/components/kit';
import { useAddTripFlow } from '@/hooks/useAddTripFlow';
import { useCreateEventFlow } from '@/hooks/useCreateEventFlow';
import { useAuth } from '@/hooks/useSession';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticSelection } from '@/lib/haptics';
import { UPCOMING_TRIPS_PAGE } from '@/graphql/queries/home';
import { fetchHomeData, fetchUpcomingTrips } from '@/services/presenceService';
import { dedupeTripMatches } from '@/services/tripService';
import { fontFamily, useTheme } from '@/theme';
import type { TripEntry, TripMatchEntry } from '@/types/trip';

type HomeTab = 'next' | 'matches' | 'activity';

type ConnectionProfile = { display_name?: string; preferred_name?: string | null; avatar_file_id?: string | null };

type HomeData = {
  upcomingTrips?: TripEntry[];
  allTrips?: TripEntry[];
  tripMatches?: TripMatchEntry[];
  connections?: {
    id: string;
    created_at: string;
    requester_id: string;
    addressee_id: string;
    requester?: { profile?: ConnectionProfile };
    addressee?: { profile?: ConnectionProfile };
  }[];
  events?: { id: string; title: string; city: string; starts_at: string; host_type?: 'user' | 'platform' }[];
};

const MAX_MATCHES = 12;

function relativeAgo(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d` : `${Math.round(days / 7)}w`;
}

function DateTile({ iso, platform }: { iso: string; platform: boolean }) {
  const theme = useTheme();
  const date = new Date(iso);
  return (
    <View
      style={{
        width: 48,
        height: 52,
        borderRadius: 14,
        backgroundColor: platform ? '#0E1113' : theme.colors.field,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 9, color: platform ? '#A8E05F' : theme.colors.accentText }}>
        {date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
      </Text>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 19, lineHeight: 21, color: platform ? '#EDF1F2' : theme.colors.textPrimary }}>
        {date.getDate()}
      </Text>
    </View>
  );
}

/** Home: What's next, Matches (crossing paths + layover search), and Activity. */
export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  const client = useApolloClient();
  const { userId, profile } = useAuth();
  const { open: openMenu } = useAppMenu();
  const { openCreateEvent, meetTypeOverlay } = useCreateEventFlow();
  const { openAddTrip, addTripMethodOverlay } = useAddTripFlow();
  const [data, setData] = useState<HomeData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState<HomeTab>('next');
  const { isWaved, waving, wave } = useWave(setToast);
  const airlines = useAirlines();
  const [airlineOnly, setAirlineOnly] = useAirlineOnlyPreference(userId);
  const tabScroll = useTabBarScroll({ contentContainerStyle: { paddingHorizontal: 24 } });

  // What's next: 5 trips, then 5 more each time you scroll near the end (while the server has more).
  const [moreTrips, setMoreTrips] = useState<TripEntry[]>([]);
  const [hasMoreTrips, setHasMoreTrips] = useState(false);
  const [loadingMoreTrips, setLoadingMoreTrips] = useState(false);
  const nowRef = useRef('');
  const shownTripsRef = useRef(UPCOMING_TRIPS_PAGE);
  const pagingRef = useRef(false);
  const loadRef = useRef(0);

  const load = useCallback(async () => {
    if (!userId) return;
    const run = ++loadRef.current;
    const now = new Date().toISOString();
    // A refresh (or coming back to the tab) keeps as many trips as were already showing.
    const limit = Math.max(UPCOMING_TRIPS_PAGE, Math.ceil(shownTripsRef.current / UPCOMING_TRIPS_PAGE) * UPCOMING_TRIPS_PAGE);
    const next = (await fetchHomeData(client, userId, now, limit)) as HomeData;
    if (run !== loadRef.current) return;
    nowRef.current = now;
    setData(next);
    setMoreTrips([]);
    setHasMoreTrips((next.upcomingTrips?.length ?? 0) >= limit);
  }, [client, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const upcomingTrips = useMemo(() => {
    const seen = new Set<string>();
    return [...(data?.upcomingTrips ?? []), ...moreTrips].filter((trip) => (seen.has(trip.id) ? false : (seen.add(trip.id), true)));
  }, [data?.upcomingTrips, moreTrips]);
  shownTripsRef.current = upcomingTrips.length;

  const loadMoreTrips = async () => {
    if (!userId || !hasMoreTrips || pagingRef.current || !nowRef.current) return;
    pagingRef.current = true;
    setLoadingMoreTrips(true);
    const run = loadRef.current;
    try {
      const page = await fetchUpcomingTrips(client, userId, nowRef.current, upcomingTrips.length);
      if (run !== loadRef.current) return;
      setMoreTrips((current) => [...current, ...page]);
      setHasMoreTrips(page.length >= UPCOMING_TRIPS_PAGE);
    } catch {
      // Leave hasMore as is, so the next scroll tries again.
    } finally {
      pagingRef.current = false;
      setLoadingMoreTrips(false);
    }
  };

  const onHomeScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    tabScroll.onScroll(event);
    if (tab !== 'next') return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) void loadMoreTrips();
  };

  const myAirline = profile?.airline_id ? airlines.get(profile.airline_id) : undefined;
  // The filter needs the user's own airline; without one it can't apply. Filter first, then cap, so it's up to 12 of theirs.
  const filtering = airlineOnly && Boolean(myAirline);
  const shownMatches = useMemo(() => {
    const current = dedupeTripMatches((data?.tripMatches ?? []).filter((match) => isCurrent(match)));
    return (filtering ? onlyAirline(current, profile?.airline_id) : current).slice(0, MAX_MATCHES);
  }, [data?.tripMatches, filtering, profile?.airline_id]);
  const connections = (data?.connections ?? [])
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5);
  const noTrips = data !== null && !(data.allTrips ?? []).length;
  const discoveryOff = profile?.default_visibility === 'off';

  const name = profile?.preferred_name || profile?.full_name || profile?.display_name || '';
  const crewLine = [myAirline?.name, profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : null].filter(Boolean).join(' · ');
  const allTrips = data?.allTrips ?? [];
  // Upcoming trips and upcoming layover cities, the same as Profile and Your trips.
  const { upcoming: upcomingCount, cities: layoverCities } = tripStats(allTrips);
  const stats = [
    { key: 'trips', value: upcomingCount, label: t('home.statsTrips'), onPress: () => router.push(SCREENS.tripsUpcoming) },
    {
      key: 'cities',
      value: layoverCities,
      label: t('home.statsCities'),
      onPress: () => router.push(SCREENS.tripsLayovers),
    },
    { key: 'connections', value: data?.connections?.length ?? 0, label: t('tabs.friends'), onPress: () => router.navigate(SCREENS.tabs.friends) },
  ];

  const tabs: { key: HomeTab; label: string }[] = [
    { key: 'next', label: t('home.whatsNext') },
    { key: 'matches', label: t('home.paths') },
    { key: 'activity', label: t('home.activity') },
  ];

  const renderMatches = () => {
    if (discoveryOff) {
      return (
        <DiscoverEmpty
          tone="outline"
          title={t('discover.offTitle')}
          body={t('discover.offBody')}
          actionLabel={t('discover.changeVisibility')}
          onAction={() => router.push(SCREENS.profile.privacy)}
        />
      );
    }
    if (noTrips) {
      return (
        <DiscoverEmpty
          tone="lime"
          title={t('home.emptyCrossing')}
          body={t('home.emptyCrossingBody')}
          actionLabel={`+ ${t('discover.addTrip')}`}
          onAction={openAddTrip}
        />
      );
    }
    return (
      <>
        <Pressable
          accessibilityRole="search"
          onPress={() => router.push(SCREENS.discover.search())}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.field,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 18,
            marginTop: 14,
            opacity: pressed ? 0.8 : 1,
          })}>
          <SearchGlyph />
          <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 15, color: theme.colors.textTertiary }}>
            {t('discover.searchPlaceholder')}
          </Text>
        </Pressable>
        {myAirline ? (
          <MyAirlineCard
            airline={myAirline}
            active={airlineOnly}
            onToggle={setAirlineOnly}
          />
        ) : null}
        <MonoLabel style={{ fontSize: 10.5, marginTop: 16 }}>{t('discover.crossingPaths')}</MonoLabel>
        {data === null ? (
          <View accessibilityLabel={t('common.loading')} style={{ gap: 8, marginTop: 10 }}>
            {[0, 1, 2].map((index) => (
              <MatchCardSkeleton key={index} />
            ))}
          </View>
        ) : shownMatches.length ? (
          <View style={{ gap: 8, marginTop: 10 }}>
            {shownMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                airline={match.matchedUser?.profile?.airline_id ? airlines.get(match.matchedUser.profile.airline_id) : null}
                myAirline={Boolean(profile?.airline_id) && match.matchedUser?.profile?.airline_id === profile?.airline_id}
                waved={isWaved(match)}
                waving={waving === match.matched_user_id}
                onWave={() => void wave(match)}
                onPress={() => openMatchProfile(router, match, t)}
              />
            ))}
          </View>
        ) : (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary, marginTop: 16 }}>
            {filtering && myAirline
              ? t('discover.airlineFilterEmpty', { airline: myAirline.name.split(' ')[0] })
              : t('home.emptyCrossingBody')}
          </Text>
        )}
      </>
    );
  };

  const renderActivity = () => (
    <>
      {(data?.events ?? []).length ? (
        <>
          <MonoLabel style={{ fontSize: 10.5, marginTop: 22 }}>{t('home.upcomingMeets')}</MonoLabel>
          <View style={{ gap: 8, marginTop: 10 }}>
            {(data?.events ?? []).map((event) => {
              const platform = event.host_type === 'platform';
              return (
                <Pressable
                  key={event.id}
                  accessibilityRole="button"
                  onPress={() => router.push(SCREENS.events.detail(event.id))}
                  style={({ pressed }) => ({
                    backgroundColor: theme.colors.card,
                    borderRadius: 18,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  <DateTile iso={event.starts_at} platform={platform} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text numberOfLines={2} style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
                      {platform ? `${t('events.platformBadge')}: ${event.title}` : event.title}
                    </Text>
                    <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
                      {`${event.city} · ${new Date(event.starts_at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`}
                    </Text>
                  </View>
                  <RowChevron color={theme.colors.textTertiary} />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
      {connections.length ? (
        <>
          <MonoLabel style={{ fontSize: 10.5, marginTop: 24 }}>{t('home.recentConnections')}</MonoLabel>
          <View style={{ marginTop: 4 }}>
            {connections.map((connection, index) => {
              const otherId = connection.requester_id === userId ? connection.addressee_id : connection.requester_id;
              const other = connection.requester_id === userId ? connection.addressee?.profile : connection.requester?.profile;
              const name = other?.preferred_name || other?.display_name || t('home.crewMember');
              return (
                <Pressable
                  key={connection.id}
                  accessibilityRole="button"
                  onPress={() => router.push(SCREENS.network.user(otherId))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: index === connections.length - 1 ? 0 : 1,
                    borderBottomColor: theme.colors.hairline,
                  }}>
                  <CrewAvatar name={name} fileId={other?.avatar_file_id} seed={otherId} size={44} />
                  <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textPrimary }}>
                    <Text style={{ fontFamily: fontFamily.interMedium }}>{name}</Text> {t('home.isNowYourFriend')}
                  </Text>
                  <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>
                    {relativeAgo(connection.created_at)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
      {!connections.length && !(data?.events ?? []).length ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
          {t('home.emptyActivity')}
        </Text>
      ) : null}
      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <Pressable
          accessibilityRole="button"
          onPress={openCreateEvent}
          style={({ pressed }) => ({
            height: 44,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: '#C9CEC1',
            paddingHorizontal: 18,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.textPrimary }}>{`+ ${t('events.createEvent')}`}</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <Screen style={{ padding: 0 }}>
      {meetTypeOverlay}
      {addTripMethodOverlay}
      <ScrollView
        {...tabScroll}
        onScroll={onHomeScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await load();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: insets.top + 18 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tabs.profile')}
            onPress={() => router.navigate(SCREENS.tabs.profile)}>
            <CrewAvatar name={name} fileId={profile?.avatar_file_id} size={68} tone="ink" />
            {!discoveryOff ? (
              <View
                style={{
                  position: 'absolute',
                  right: 1,
                  bottom: 1,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: theme.colors.fill,
                  borderWidth: 3,
                  borderColor: theme.colors.bgCanvas,
                }}
              />
            ) : null}
          </Pressable>
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, letterSpacing: -0.4, color: theme.colors.textPrimary }}>
              {name}
            </Text>
            {crewLine ? (
              <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>
                {crewLine}
              </Text>
            ) : null}
          </View>
          <CircleButton accessibilityLabel={t('menu.open')} onPress={openMenu}>
            <MenuGlyph color={theme.colors.textPrimary} />
          </CircleButton>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 22, backgroundColor: theme.colors.card, borderRadius: 18, paddingVertical: 14 }}>
          {stats.map((item, index) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={`${item.value} ${item.label}`}
              onPress={item.onPress}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                gap: 2,
                borderLeftWidth: index === 0 ? 0 : 1,
                borderLeftColor: '#EEF0EA',
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, color: theme.colors.textPrimary }}>{data ? item.value : '–'}</Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textSecondary }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openAddTrip}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 28,
            marginTop: 16,
            backgroundColor: pressed ? theme.colors.accentPressed : theme.colors.fill,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          })}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, lineHeight: 24, color: theme.colors.onFill }}>+</Text>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.onFill }}>{t('discover.addTrip')}</Text>
        </Pressable>
        {noTrips ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 10 }}>
            {t('home.addTripHint')}
          </Text>
        ) : null}
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
          {tabs.map((item) => {
            const selected = tab === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  hapticSelection();
                  setTab(item.key);
                }}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: selected ? theme.colors.ink : theme.colors.field,
                  justifyContent: 'center',
                }}>
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: selected ? theme.colors.ground : theme.colors.textPrimary }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {tab === 'next' ? (
          <View style={{ gap: 10, marginTop: 16 }}>
            {upcomingTrips.length ? (
              upcomingTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  matchCount={new Set((data?.tripMatches ?? []).filter((match) => match.source_trip_id === trip.id).map((match) => match.matched_user_id)).size}
                  onPress={trip.stays?.length ? () => router.push(SCREENS.discover.layover(trip.id)) : undefined}
                />
              ))
            ) : data ? (
              <NoTripsCard icon={<PlaneGlyph color={theme.colors.textSecondary} />} />
            ) : null}
            {loadingMoreTrips ? <Skeleton height={112} borderRadius={20} /> : null}
          </View>
        ) : tab === 'matches' ? (
          renderMatches()
        ) : (
          renderActivity()
        )}
      </ScrollView>
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
    </Screen>
  );
}
