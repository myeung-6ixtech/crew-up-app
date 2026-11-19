import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { BackGlyph, CircleButton, CrewAvatar } from '@/components/crew/kit';
import { personName } from '@/components/crew/people';
import { DotsGlyph } from '@/components/events/host';
import { StandaloneNavPill } from '@/components/navigation/FloatingTabBar';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { SafetySheet, type SafetyAction } from '@/components/safety/SafetySheet';
import { AppIcon, Screen, Toast } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { memberSinceWhen } from '@/features/onboarding/memberSince';
import { useAuth } from '@/hooks/useSession';
import { AirlineLine, AirlineMark, useAirlines } from '@/components/crew/airline';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { fetchActivityPreferences } from '@/services/activityService';
import { waveMetaFromRoute, type WaveMeta } from '@/components/discover/wave';
import { ConnectionRequestError, fetchConnections, fetchPublicProfile, requestConnection } from '@/services/connectionService';
import { ensureDirectThread, postLayoverNudge } from '@/services/messagingService';
import { fetchAirlines } from '@/services/profileService';
import { fontFamily, shouldUppercaseLabels, useTheme } from '@/theme';
import type { ActivityPreference } from '@/types/domain';
import { PlacesLine } from '@/components/profile/PlacesLine';

type PublicProfile = {
  user_id: string;
  display_name: string;
  preferred_name?: string | null;
  username?: string | null;
  avatar_file_id?: string | null;
  role_type?: string | null;
  crew_role?: string | null;
  base_airport?: string | null;
  base_airport_iata?: string | null;
  airline_id?: string | null;
  residence_city?: string | null;
  residence_country_code?: string | null;
  hometown_city?: string | null;
  home_country_code?: string | null;
  languages?: string[] | null;
  visible_gender?: 'male' | 'female' | 'unspecified' | null;
  created_at?: string | null;
};

type Relationship = 'none' | 'requested' | 'incoming' | 'friends';

/** One poke per person per day from a profile (the database allows one per overlap key). */
const profilePokeMeta = (): WaveMeta => ({ overlap_key: `profile:${new Date().toISOString().slice(0, 10)}` });

type Params = {
  userId: string;
  /** From Discover / Crossing Paths: the overlap ("why you match"), used for the card and the poke. */
  wave?: string;
  waveCity?: string;
  waveMatchType?: string;
  waveStart?: string;
  waveEnd?: string;
  waveFlight?: string;
  matchLabel?: string;
  matchTitle?: string;
  matchDetail?: string;
};

function BigButton({
  label,
  onPress,
  tone,
  height = 52,
  loading,
  icon,
}: {
  label: string;
  onPress?: () => void;
  tone: 'lime' | 'done' | 'outline';
  height?: number;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const theme = useTheme();
  const inactive = tone === 'done' || !onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive || loading}
      onPress={() => {
        hapticImpact();
        onPress?.();
      }}
      style={({ pressed }) => ({
        height,
        borderRadius: height / 2,
        backgroundColor: tone === 'lime' ? theme.colors.fill : tone === 'done' ? theme.colors.field : 'transparent',
        borderWidth: tone === 'outline' ? 1.5 : 0,
        borderColor: theme.mode === 'dark' ? theme.colors.hairline : '#C9CEC1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 18,
        opacity: pressed ? 0.8 : 1,
      })}>
      {loading ? (
        <ActivityIndicator color={theme.colors.onFill} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              fontFamily: fontFamily.jakartaBold,
              fontSize: height >= 52 ? 16 : 14,
              color: tone === 'done' ? theme.colors.textSecondary : tone === 'outline' ? theme.colors.textPrimary : theme.colors.onFill,
            }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/**
 * Someone else's profile (frames 7A–7F): one screen, two states. Friends get Message + Poke; everyone else gets
 * Add friend (Requested / Accept request) + Poke, and Message unlocks once they accept. Unfriend, Report and Block live
 * in the ⋯ sheet (SafetySheet), not on the page. The Crew ID is never shown.
 */
export default function PublicProfileScreen() {
  const params = useLocalSearchParams<Params>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  const client = useApolloClient();
  const { userId, profile: me } = useAuth();
  const airlines = useAirlines();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [airlineName, setAirlineName] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<ActivityPreference[]>([]);
  const [relationship, setRelationship] = useState<Relationship>('none');
  const [sending, setSending] = useState(false);
  const [poking, setPoking] = useState(false);
  const [poked, setPoked] = useState(false);
  const [opening, setOpening] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!params.userId || !userId) return;
    const [nextProfile, preferences, connections] = await Promise.all([
      fetchPublicProfile(client, params.userId) as Promise<PublicProfile | null>,
      fetchActivityPreferences(client, params.userId).catch(() => []),
      fetchConnections(client, userId).catch(() => []),
    ]);
    setProfile(nextProfile);
    setPreferences(preferences);
    const row = (connections as { status: string; requester_id: string; addressee_id: string }[]).find(
      (c) =>
        (c.requester_id === userId && c.addressee_id === params.userId) ||
        (c.addressee_id === userId && c.requester_id === params.userId),
    );
    setRelationship(
      !row || row.status === 'blocked'
        ? 'none'
        : row.status === 'accepted'
          ? 'friends'
          : row.requester_id === userId
            ? 'requested'
            : 'incoming',
    );
    if (nextProfile?.airline_id) {
      const airlines = (await fetchAirlines(client).catch(() => [])) as { id: string; name: string }[];
      setAirlineName(airlines.find((row) => row.id === nextProfile.airline_id)?.name ?? null);
    }
  }, [client, params.userId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const errorToast = (e: unknown) => {
    hapticError();
    setToast(e instanceof ConnectionRequestError && e.code === 'BLOCKED' ? t('friends.requestBlocked') : t('onboarding.genericError'));
  };

  /** Add friend, or Accept request when they asked first (a request back accepts theirs). */
  const addFriend = async () => {
    if (!profile) return;
    setSending(true);
    try {
      const result = await requestConnection(client, profile.user_id);
      hapticSuccess();
      setRelationship(result.outcome === 'accepted' || result.outcome === 'already_friends' ? 'friends' : 'requested');
      setToast(result.outcome === 'accepted' ? t('profile.nowFriends') : t('friends.requestSentToast'));
    } catch (e) {
      if (e instanceof ConnectionRequestError && e.code === 'ALREADY_FRIENDS') setRelationship('friends');
      else errorToast(e);
    } finally {
      setSending(false);
    }
  };

  /**
   * Poke: a friend gets it in your chat; anyone else gets it as a friend request (notified as a poke). From Crossing
   * Paths it carries the overlap; from a profile, one a day.
   */
  const poke = async () => {
    if (!profile) return;
    const meta = waveMetaFromRoute(params) ?? profilePokeMeta();
    setPoking(true);
    try {
      if (relationship === 'friends') {
        await postLayoverNudge(client, profile.user_id, meta);
      } else {
        const result = await requestConnection(client, profile.user_id, t('home.waveMessage'), meta);
        if (result.outcome === 'accepted') {
          await postLayoverNudge(client, profile.user_id, meta).catch(() => undefined);
          setRelationship('friends');
        } else {
          setRelationship('requested');
        }
      }
      hapticSuccess();
      setPoked(true);
      setToast(t('messages.waveSent'));
    } catch (e) {
      // Already poked for this overlap (or today): that's the same end state.
      if (e instanceof Error && /unique|duplicate|already/i.test(e.message)) setPoked(true);
      else if (e instanceof ConnectionRequestError && e.code === 'ALREADY_FRIENDS') {
        setRelationship('friends');
        await postLayoverNudge(client, profile.user_id, meta).then(() => setPoked(true), errorToast);
      } else errorToast(e);
    } finally {
      setPoking(false);
    }
  };

  const message = async () => {
    if (!userId || !profile) return;
    setOpening(true);
    try {
      const threadId = await ensureDirectThread(profile.user_id);
      router.push(SCREENS.messages.thread(threadId, profile.user_id));
    } catch {
      hapticError();
      setToast(t('onboarding.genericError'));
    } finally {
      setOpening(false);
    }
  };

  const afterSafety = (action: SafetyAction) => {
    if (action === 'blocked') router.back();
    else if (action === 'unfriended') {
      setRelationship('none');
      setPoked(false);
    }
  };

  const name = profile ? personName(profile) : '';
  const firstName = name.split(' ')[0];
  const airport = findAirportByIata(profile?.base_airport_iata ?? profile?.base_airport);
  const role = profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : profile?.role_type;
  const headline = [role, airlineName, airport?.iata ?? profile?.base_airport].filter(Boolean).join(' · ');
  const theirAirline = profile?.airline_id ? airlines.get(profile.airline_id) : null;
  const roleBase = [role, airport?.iata ?? profile?.base_airport].filter(Boolean).join(' · ');
  const flightCode = params.matchTitle?.match(/^([A-Z0-9]{2})\d/)?.[1] ?? null;
  const since = profile?.created_at ? memberSinceWhen(profile.created_at, t) : '';
  const friends = relationship === 'friends';
  const requested = relationship === 'requested';
  const incoming = relationship === 'incoming';
  const pokeButton = (
    <View style={{ flex: 1 }}>
      <BigButton tone={poked ? 'done' : 'outline'} label={poked ? t('profile.poked') : t('profile.poke')} loading={poking} onPress={poked ? undefined : () => void poke()} />
    </View>
  );

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <CircleButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
          <BackGlyph color={theme.colors.textPrimary} />
        </CircleButton>
        <Text accessibilityRole="header" numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>
          {profile?.username ? `@${profile.username}` : name}
        </Text>
        {profile ? (
          <CircleButton accessibilityLabel={t('safetySheet.moreOptions', { name: firstName })} onPress={() => setMenuOpen(true)}>
            <DotsGlyph color={theme.colors.textPrimary} />
          </CircleButton>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
      {!profile ? (
        <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 80 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 120 }}>
          <View style={{ alignItems: 'center', gap: 4, marginTop: 16 }}>
            <CrewAvatar name={name} fileId={profile.avatar_file_id} seed={profile.user_id} size={92} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, letterSpacing: -0.4, color: theme.colors.textPrimary }}>{name}</Text>
              {profile.visible_gender === 'male' || profile.visible_gender === 'female' ? (
                <AppIcon name={profile.visible_gender === 'female' ? 'genderFemale' : 'genderMale'} size={15} color={theme.colors.accentText} />
              ) : null}
            </View>
            {theirAirline ? (
              <AirlineLine airline={theirAirline} mine={theirAirline.id === me?.airline_id} rest={roleBase} />
            ) : headline ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>{headline}</Text>
            ) : null}
            <PlacesLine person={profile} style={{ textAlign: 'center', marginTop: 2 }} />
            {since ? <MonoLabel style={{ fontSize: 10, color: theme.colors.textTertiary, marginTop: 2 }}>{t('onboarding.review.memberSince', { when: since })}</MonoLabel> : null}
            {friends ? (
              <Text
                style={{
                  fontFamily: fontFamily.monoMedium,
                  fontSize: 10,
                  letterSpacing: 0.8,
                  color: theme.colors.textSecondary,
                  backgroundColor: theme.colors.field,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 9,
                  overflow: 'hidden',
                  marginTop: 6,
                  textTransform: shouldUppercaseLabels() ? 'uppercase' : 'none',
                }}>
                {t('tabs.friends')}
              </Text>
            ) : null}
          </View>

          {!friends && params.matchTitle ? (
            <View style={{ backgroundColor: theme.colors.accentSubtle, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginTop: 16, gap: 3 }}>
              {params.matchLabel ? <MonoLabel style={{ fontSize: 10, color: theme.colors.accentText }}>{params.matchLabel}</MonoLabel> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {flightCode ? <AirlineMark code={flightCode} size={22} /> : null}
                <Text style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>{params.matchTitle}</Text>
              </View>
              {params.matchDetail ? (
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{params.matchDetail}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={{ gap: 8, marginTop: !friends && params.matchTitle ? 14 : 18 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                {friends ? (
                  <BigButton tone="lime" label={t('chat.message')} loading={opening} onPress={() => void message()} />
                ) : (
                  <BigButton
                    tone={requested ? 'done' : 'lime'}
                    label={requested ? t('profile.requested') : incoming ? t('friends.acceptRequest') : t('friends.addFriend')}
                    loading={sending}
                    onPress={requested ? undefined : () => void addFriend()}
                  />
                )}
              </View>
              {pokeButton}
            </View>
            {friends ? null : (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, textAlign: 'center' }}>
                {t('profile.messageUnlocksShort', { name: firstName })}
              </Text>
            )}
          </View>

          {/* No Crew ID here: it's owner-only. */}
          <ProfileDetails person={profile} airlineName={airlineName} preferences={preferences} showPlaces={false} />
        </ScrollView>
      )}
      {profile ? (
        <SafetySheet
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          person={{ userId: profile.user_id, name: firstName }}
          isFriend={friends}
          context={{ source: 'profile', relationship, match: params.matchTitle }}
          onDone={afterSafety}
        />
      ) : null}
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
      <StandaloneNavPill active={null} />
    </Screen>
  );
}
