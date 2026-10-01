import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleButton, CrewAvatar, MenuGlyph, RowChevron } from '@/components/crew/kit';
import { DiscoverEmpty, openMatchProfile } from '@/components/discover/DiscoverEmpty';
import { MatchCard } from '@/components/discover/MatchCard';
import { isCurrent } from '@/components/discover/matches';
import { useWave } from '@/components/discover/useWave';
import { UpcomingTripsCarousel } from '@/components/home/UpcomingTripsCarousel';
import { Screen, Toast } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { useAppMenu } from '@/contexts/AppMenuContext';
import { MonoLabel, SearchGlyph } from '@/features/onboarding/components/kit';
import { useAddTripFlow } from '@/hooks/useAddTripFlow';
import { useCreateEventFlow } from '@/hooks/useCreateEventFlow';
import { useAuth } from '@/hooks/useSession';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticSelection } from '@/lib/haptics';
import { fetchHomeData } from '@/services/presenceService';
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
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId, profile } = useAuth();
  const { open: openMenu } = useAppMenu();
  const { openCreateEvent, meetTypeOverlay } = useCreateEventFlow();
  const { openAddTrip, addTripMethodOverlay } = useAddTripFlow();
  const [data, setData] = useState<HomeData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState<HomeTab>('matches');
  const { waved, waving, wave } = useWave(setToast);
  const tabScroll = useTabBarScroll({ contentContainerStyle: { paddingHorizontal: 24 } });

  const load = useCallback(async () => {
    if (!userId) return;
    setData((await fetchHomeData(client, userId)) as HomeData);
  }, [client, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const matches = useMemo(
    () => dedupeTripMatches((data?.tripMatches ?? []).filter((match) => isCurrent(match))).slice(0, MAX_MATCHES),
    [data?.tripMatches],
  );
  const connections = (data?.connections ?? [])
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5);
  const noTrips = data !== null && !(data.allTrips ?? []).length;
  const discoveryOff = profile?.default_visibility === 'off';

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 }}>
          <MonoLabel style={{ fontSize: 10.5 }}>{t('discover.crossingPaths')}</MonoLabel>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>
            {t('discover.ofMax', { count: matches.length, max: MAX_MATCHES })}
          </Text>
        </View>
        {matches.length ? (
          <View style={{ gap: 8, marginTop: 10 }}>
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                waved={waved.has(match.matched_user_id)}
                waving={waving === match.matched_user_id}
                onWave={() => void wave(match.matched_user_id)}
                onPress={() => openMatchProfile(router, match, t)}
              />
            ))}
          </View>
        ) : (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary, marginTop: 16 }}>
            {t('home.emptyCrossingBody')}
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
      <View style={{ paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 24 }}>
          <Image
            source={require('@/assets/logos/crewup-wordmark-ink-2400.png')}
            accessibilityRole="header"
            accessibilityLabel={t('appName')}
            resizeMode="contain"
            style={{ height: 26, width: 91, tintColor: theme.mode === 'dark' ? '#EDF1F2' : undefined }}
          />
          <CircleButton accessibilityLabel={t('menu.open')} onPress={openMenu}>
            <MenuGlyph color={theme.colors.textPrimary} />
          </CircleButton>
        </View>
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8, paddingTop: 16, paddingHorizontal: 24 }}>
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
      </View>
      <ScrollView
        {...tabScroll}
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
        {tab === 'next' ? (
          <View style={{ marginTop: 16, marginHorizontal: -24 }}>
            <UpcomingTripsCarousel
              trips={data?.upcomingTrips ?? []}
              embedded
              onPressTrip={(trip) => router.push(SCREENS.discover.layover(trip.id))}
            />
            <View style={{ alignItems: 'center', marginTop: 18 }}>
              <Pressable
                accessibilityRole="button"
                onPress={openAddTrip}
                style={({ pressed }) => ({
                  height: 44,
                  borderRadius: 22,
                  paddingHorizontal: 18,
                  backgroundColor: theme.colors.fill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}>
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.onFill }}>{`+ ${t('discover.addTrip')}`}</Text>
              </Pressable>
            </View>
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
