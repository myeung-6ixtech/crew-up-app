import { useCallback, useMemo, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Toast } from '@/components/ui';
import { ProfileHeader } from '@/components/home/ProfileHeader';
import { HomeContentTabs, type HomeTabId } from '@/components/home/HomeContentTabs';
import { UpcomingTripsCarousel } from '@/components/home/UpcomingTripsCarousel';
import { CrewCrossingPaths } from '@/components/home/CrewCrossingPaths';
import { ActivityFeed } from '@/components/home/ActivityFeed';
import { useAuth } from '@/hooks/useSession';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useCreateEventFlow } from '@/hooks/useCreateEventFlow';
import { fetchHomeData } from '@/services/presenceService';
import { fetchAirlines } from '@/services/profileService';
import { resolveCurrentStatus } from '@/lib/dutyStatus';
import { countUniqueCities, findCrewCrossingPaths } from '@/lib/rosterMatching';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles } from '@/theme';
import type { RosterEntry } from '@/types/domain';

type HomeData = {
  upcomingRosters?: RosterEntry[];
  allRosters?: RosterEntry[];
  connections?: {
    id: string;
    created_at: string;
    requester_id: string;
    addressee_id: string;
    requester?: { profile?: { display_name?: string } };
    addressee?: { profile?: { display_name?: string } };
  }[];
  presence?: {
    id: string;
    user_id: string;
    city: string;
    date_start: string;
    date_end: string;
    user?: { profile?: { display_name?: string; role_type?: string } };
  }[];
  events?: { id: string; title: string; city: string; starts_at: string }[];
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { userId, profile } = useAuth();
  const styles = useThemedStyles(() => ({
    feed: {},
  }));

  const [data, setData] = useState<HomeData | null>(null);
  const [airlineName, setAirlineName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState<HomeTabId>('trips');

  const load = useCallback(async () => {
    if (!userId) return;
    const result = (await fetchHomeData(client, userId)) as HomeData;
    setData(result);
    if (profile?.airline_id) {
      const airlines = await fetchAirlines(client);
      const match = airlines.find((a: { id: string }) => a.id === profile.airline_id);
      setAirlineName(match?.name ?? null);
    }
  }, [client, userId, profile?.airline_id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const allRosters = data?.allRosters ?? [];
  const upcoming = data?.upcomingRosters ?? [];
  const connections = data?.connections ?? [];
  const tripCount = allRosters.length;
  const cityCount = countUniqueCities(allRosters);
  const connectionCount = connections.length;
  const status = resolveCurrentStatus(allRosters, profile);

  const crossingPaths = useMemo(
    () => findCrewCrossingPaths(allRosters, data?.presence ?? [], userId ?? ''),
    [allRosters, data?.presence, userId],
  );

  const activityItems = useMemo(() => {
    const items: { id: string; title: string; subtitle: string; route?: string }[] = [];
    for (const c of connections.slice(0, 5)) {
      const name =
        c.requester_id === userId
          ? c.addressee?.profile?.display_name
          : c.requester?.profile?.display_name;
      items.push({
        id: `conn-${c.id}`,
        title: t('home.activityConnection', { name: name ?? t('home.crewMember') }),
        subtitle: new Date(c.created_at).toLocaleDateString(),
        route: SCREENS.tabs.friends,
      });
    }
    for (const e of data?.events ?? []) {
      items.push({
        id: `event-${e.id}`,
        title: e.title,
        subtitle: `${e.city} · ${new Date(e.starts_at).toLocaleDateString()}`,
        route: SCREENS.events.detail(e.id),
      });
    }
    return items.sort((a, b) => (a.subtitle < b.subtitle ? 1 : -1)).slice(0, 8);
  }, [connections, data?.events, userId, t]);

  const onWaveSent = () => {
    setToastMessage(t('home.waveSent'));
    setToastVisible(true);
  };

  const tabScroll = useTabBarScroll({ contentContainerStyle: styles.feed });
  const { openCreateEvent, meetTypeOverlay } = useCreateEventFlow();

  return (
    <Screen style={{ padding: 0 }}>
      {meetTypeOverlay}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      <ScrollView
        {...tabScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <ProfileHeader
          profile={profile}
          status={status}
          statusPulseKey={0}
          tripCount={tripCount}
          cityCount={cityCount}
          connectionCount={connectionCount}
          airlineName={airlineName}
        />

        <HomeContentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'trips', label: t('home.upcomingTrips') },
            { id: 'paths', label: t('home.paths') },
            { id: 'activity', label: t('home.activity') },
          ]}>
          {activeTab === 'trips' ? (
            <UpcomingTripsCarousel trips={upcoming} embedded />
          ) : null}
          {activeTab === 'paths' ? (
            <CrewCrossingPaths
              paths={crossingPaths}
              client={client}
              onWave={onWaveSent}
              embedded
            />
          ) : null}
          {activeTab === 'activity' ? (
            <ActivityFeed items={activityItems} embedded onCreateEvent={openCreateEvent} />
          ) : null}
        </HomeContentTabs>
      </ScrollView>
    </Screen>
  );
}
