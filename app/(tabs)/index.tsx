import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Button, AppIcon, Toast, BodyText } from '@/components/ui';
import { ProfileHeader } from '@/components/home/ProfileHeader';
import { AddTripSheet } from '@/components/home/AddTripSheet';
import { UpcomingTripsCarousel } from '@/components/home/UpcomingTripsCarousel';
import { CrewCrossingPaths } from '@/components/home/CrewCrossingPaths';
import { ActivityFeed } from '@/components/home/ActivityFeed';
import { useAuth, useSession } from '@/hooks/useSession';
import { fetchHomeData } from '@/services/presenceService';
import { fetchAirlines } from '@/services/profileService';
import { resolveCurrentStatus } from '@/lib/dutyStatus';
import { countUniqueCities, findCrewCrossingPaths } from '@/lib/rosterMatching';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles, useTheme } from '@/theme';
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
  const theme = useTheme();
  const { userId, profile } = useAuth();
  const { refreshProfile } = useSession();
  const styles = useThemedStyles((t) => ({
    ctaWrap: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.lg,
      paddingBottom: t.spacing.lg,
      backgroundColor: t.colors.bgCanvas,
    },
    feed: { paddingBottom: t.spacing.xxxl },
  }));

  const [data, setData] = useState<HomeData | null>(null);
  const [airlineName, setAirlineName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [statusPulseKey, setStatusPulseKey] = useState(0);

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

  useEffect(() => {
    void load();
  }, [load]);

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

  const onTripSaved = () => {
    setStatusPulseKey((k) => k + 1);
    setToastMessage(t('home.tripAdded'));
    setToastVisible(true);
    void load();
  };

  const onWaveSent = () => {
    setToastMessage(t('home.waveSent'));
    setToastVisible(true);
  };

  return (
    <Screen style={{ padding: 0 }}>
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickyHeaderIndices={[0, 1]}
        contentContainerStyle={styles.feed}>
        <ProfileHeader
          profile={profile}
          status={status}
          statusPulseKey={statusPulseKey}
          tripCount={tripCount}
          cityCount={cityCount}
          connectionCount={connectionCount}
          airlineName={airlineName}
        />

        <View style={styles.ctaWrap}>
          <Button
            label={t('home.addTrip')}
            noTopMargin
            onPress={() => setSheetOpen(true)}
            icon={<AppIcon name="add" size={20} color={theme.colors.textInverse} />}
          />
          {tripCount === 0 ? (
            <BodyText muted style={{ textAlign: 'center', marginTop: 8 }}>
              {t('home.addTripEmptyHint')}
            </BodyText>
          ) : null}
        </View>

        <UpcomingTripsCarousel trips={upcoming} />
        <CrewCrossingPaths paths={crossingPaths} client={client} onWave={onWaveSent} />
        <ActivityFeed items={activityItems} />
      </ScrollView>

      {userId ? (
        <AddTripSheet
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          client={client}
          userId={userId}
          profile={profile}
          refreshProfile={refreshProfile}
          onSaved={onTripSaved}
        />
      ) : null}
    </Screen>
  );
}
