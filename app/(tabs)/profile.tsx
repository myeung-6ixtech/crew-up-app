import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { CrewAvatar, CircleButton, MenuGlyph, SmallPillButton } from '@/components/crew/kit';
import { CrewIdDarkCard, useCrewIdActions } from '@/components/crew/CrewIdDarkCard';
import { ScanFrameGlyph } from '@/components/crew/qrGlyphs';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { AppIcon, Screen } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { useAppMenu } from '@/contexts/AppMenuContext';
import { useAuth } from '@/hooks/useSession';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { AirlineLine, useAirlines } from '@/components/crew/airline';
import { useApolloClient } from '@/lib/apolloHooks';
import { fetchActivityPreferences } from '@/services/activityService';
import { fetchHomeData } from '@/services/presenceService';
import { tripStats } from '@/lib/tripStats';
import { fetchAirlines } from '@/services/profileService';
import { fontFamily, useTheme } from '@/theme';
import type { ActivityPreference } from '@/types/domain';
import type { TripEntry } from '@/types/trip';

type ProfileStats = { trips: number; cities: number; friends: number };

/** Profile tab: counts, two equal actions, the Crew ID card, then the same details as someone else's profile (ProfileDetails). */
export default function ProfileTab() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  const client = useApolloClient();
  const { open: openMenu } = useAppMenu();
  const { profile, userId } = useAuth();
  const { share } = useCrewIdActions(profile?.friend_id);
  const [stats, setStats] = useState<ProfileStats>({ trips: 0, cities: 0, friends: 0 });
  const [airlineName, setAirlineName] = useState<string | null>(null);
  const airlines = useAirlines();
  const [preferences, setPreferences] = useState<ActivityPreference[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const tabScroll = useTabBarScroll({ contentContainerStyle: { paddingHorizontal: 24 } });

  const load = useCallback(async () => {
    if (!userId) return;
    const [home, preferences, airlines] = await Promise.all([
      fetchHomeData(client, userId) as Promise<{ allTrips?: TripEntry[]; connections?: unknown[] }>,
      fetchActivityPreferences(client, userId).catch(() => []),
      profile?.airline_id ? fetchAirlines(client).catch(() => []) : Promise.resolve([]),
    ]);
    const counts = tripStats(home.allTrips ?? []);
    setStats({ trips: counts.upcoming, cities: counts.cities, friends: home.connections?.length ?? 0 });
    setPreferences(preferences);
    setAirlineName((airlines as { id: string; name: string }[]).find((row) => row.id === profile?.airline_id)?.name ?? null);
  }, [client, profile?.airline_id, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const name = profile?.preferred_name || profile?.full_name || profile?.display_name || '';
  const airport = findAirportByIata(profile?.base_airport_iata ?? profile?.base_airport);
  const myAirline = profile?.airline_id ? airlines.get(profile.airline_id) : null;
  const roleBase = [
    profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : null,
    airport?.iata ?? profile?.base_airport_iata,
  ]
    .filter(Boolean)
    .join(' · ');
  const crewLine = [airlineName, roleBase].filter(Boolean).join(' · ');
  // Home and hometown sit under the name here, so the details below skip PLACES.
  const placesLine = [
    profile?.residence_city ? t('onboarding.review.livesIn', { place: profile.residence_city }) : null,
    profile?.hometown_city ? t('onboarding.review.from', { place: profile.hometown_city }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const showGenderIcon =
    profile?.own_show_gender !== false && (profile?.visible_gender === 'male' || profile?.visible_gender === 'female');
  const statItems = [
    // Same counts and taps as Home: upcoming trips, and the cities of upcoming layovers.
    { key: 'trips', value: stats.trips, label: t('home.statsTrips'), onPress: () => router.push(SCREENS.tripsUpcoming) },
    { key: 'cities', value: stats.cities, label: t('home.statsCities'), onPress: () => router.push(SCREENS.tripsLayovers) },
    { key: 'friends', value: stats.friends, label: t('tabs.friends'), onPress: () => router.navigate(SCREENS.tabs.friends) },
  ];

  return (
    <Screen style={{ padding: 0 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 8,
          paddingHorizontal: 24,
        }}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{ flex: 1, fontFamily: fontFamily.jakartaBold, fontSize: 19, color: theme.colors.textPrimary }}>
          {profile?.username ? `@${profile.username}` : name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <CircleButton accessibilityLabel={t('friends.scanCrewQr')} onPress={() => router.push(SCREENS.friends.scan)}>
            <ScanFrameGlyph color={theme.colors.textPrimary} />
          </CircleButton>
          <CircleButton accessibilityLabel={t('menu.open')} onPress={openMenu}>
            <MenuGlyph color={theme.colors.textPrimary} />
          </CircleButton>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 16 }}>
          <CrewAvatar name={name} fileId={profile?.avatar_file_id} size={84} tone="ink" />
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {statItems.map((item, index) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={`${item.value} ${item.label}`}
                onPress={item.onPress}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 1,
                  borderLeftWidth: index === 1 ? 1 : 0,
                  borderRightWidth: index === 1 ? 1 : 0,
                  borderColor: theme.colors.hairline,
                }}>
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 19, color: theme.colors.textPrimary }}>{item.value}</Text>
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textSecondary }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 2, marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 18, color: theme.colors.textPrimary }}>{name}</Text>
            {showGenderIcon ? (
              <AppIcon
                name={profile?.visible_gender === 'female' ? 'genderFemale' : 'genderMale'}
                size={15}
                color={theme.colors.accentText}
              />
            ) : null}
          </View>
          {myAirline ? (
            <View style={{ marginVertical: 2 }}>
              <AirlineLine airline={myAirline} mine rest={roleBase} size={22} emphasize />
            </View>
          ) : crewLine ? (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>{crewLine}</Text>
          ) : null}
          {placesLine ? (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>{placesLine}</Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <SmallPillButton style={{ flex: 1 }} label={t('profile.editTitle')} onPress={() => router.push(SCREENS.profile.edit)} />
          <SmallPillButton style={{ flex: 1 }} label={t('profile.shareCrewId')} onPress={() => void share()} />
        </View>

        <View style={{ marginTop: 16 }}>
          <CrewIdDarkCard friendId={profile?.friend_id} />
        </View>

        {profile ? <ProfileDetails person={profile} airlineName={airlineName} preferences={preferences} expandable showPlaces={false} /> : null}
      </ScrollView>
    </Screen>
  );
}
