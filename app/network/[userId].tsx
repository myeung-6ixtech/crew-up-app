import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { LANGUAGES } from '@crewup/shared';
import { CrewAvatar, FactRow, PillGroup, PushedTopBar, WhiteCard } from '@/components/crew/kit';
import { personName } from '@/components/crew/people';
import { StandaloneNavPill } from '@/components/navigation/FloatingTabBar';
import { ReportSheet } from '@/components/ReportSheet';
import { AppIcon, Screen, Toast } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { memberSinceWhen } from '@/features/onboarding/memberSince';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatFriendId } from '@/lib/friendId';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { fetchActivityPreferences } from '@/services/activityService';
import { ConnectionRequestError, fetchConnections, fetchPublicProfile, requestConnection } from '@/services/connectionService';
import { ensureDirectThread } from '@/services/messagingService';
import { fetchAirlines } from '@/services/profileService';
import { reportAndBlock, reportUser } from '@/services/safetyService';
import { fontFamily, shouldUppercaseLabels, useTheme } from '@/theme';

const LANGUAGE_NAMES = new Map(LANGUAGES.map(([code, name]) => [code, name]));

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
  friend_id?: string | null;
  residence_city?: string | null;
  residence_country_code?: string | null;
  hometown_city?: string | null;
  home_country_code?: string | null;
  languages?: string[] | null;
  visible_gender?: 'male' | 'female' | 'unspecified' | null;
  created_at?: string | null;
};

type Relationship = 'none' | 'requested' | 'incoming' | 'friends';

type Params = {
  userId: string;
  /** From Discover: Wave instead of Connect, and the overlap shown in a lime card. */
  wave?: string;
  matchLabel?: string;
  matchTitle?: string;
  matchDetail?: string;
};

function LockGlyph({ color }: { color: string }) {
  return (
    <Svg width={13} height={15} viewBox="0 0 16 18">
      <Rect x={2} y={8} width={12} height={9} rx={2} fill={color} />
      <Path d="M5 8V5.5a3 3 0 016 0V8" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

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
  tone: 'lime' | 'done' | 'outline' | 'locked';
  height?: number;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const theme = useTheme();
  const inactive = tone === 'done' || tone === 'locked' || !onPress;
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
        borderWidth: tone === 'outline' || tone === 'locked' ? 1.5 : 0,
        borderStyle: tone === 'locked' ? 'dashed' : 'solid',
        borderColor: '#C9CEC1',
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
              color: tone === 'locked' ? theme.colors.textTertiary : tone === 'done' ? theme.colors.textSecondary : theme.colors.onFill,
            }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Someone else's profile. Friends get Message; everyone else gets Connect (or Wave from Discover), and Message unlocks once they accept. */
export default function PublicProfileScreen() {
  const params = useLocalSearchParams<Params>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [airlineName, setAirlineName] = useState<string | null>(null);
  const [activityNames, setActivityNames] = useState<string[]>([]);
  const [interestNames, setInterestNames] = useState<string[]>([]);
  const [relationship, setRelationship] = useState<Relationship>('none');
  const [sending, setSending] = useState(false);
  const [opening, setOpening] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState('');
  const wave = params.wave === '1';

  const load = useCallback(async () => {
    if (!params.userId || !userId) return;
    const [nextProfile, preferences, connections] = await Promise.all([
      fetchPublicProfile(client, params.userId) as Promise<PublicProfile | null>,
      fetchActivityPreferences(client, params.userId).catch(() => []),
      fetchConnections(client, userId).catch(() => []),
    ]);
    setProfile(nextProfile);
    setActivityNames(preferences.filter((item) => item.kind === 'activity').map((item) => item.name));
    setInterestNames(preferences.filter((item) => item.kind === 'interest').map((item) => item.name));
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

  const connect = async () => {
    if (!profile) return;
    setSending(true);
    try {
      await requestConnection(client, profile.user_id, wave ? t('home.waveMessage') : undefined);
      hapticSuccess();
      await load();
      setToast(t('friends.requestSentToast'));
    } catch (e) {
      hapticError();
      setToast(
        e instanceof ConnectionRequestError && e.code === 'ALREADY_FRIENDS'
          ? t('friends.alreadyFriends')
          : e instanceof ConnectionRequestError && e.code === 'BLOCKED'
            ? t('friends.requestBlocked')
            : t('onboarding.genericError'),
      );
    } finally {
      setSending(false);
    }
  };

  const message = async () => {
    if (!userId || !profile) return;
    setOpening(true);
    try {
      const threadId = await ensureDirectThread(client, userId, profile.user_id);
      router.push(SCREENS.messages.thread(threadId, profile.user_id));
    } catch {
      hapticError();
      setToast(t('onboarding.genericError'));
    } finally {
      setOpening(false);
    }
  };

  const confirmBlock = () => {
    if (!profile) return;
    Alert.alert(t('safety.blockConfirmTitle', { name: personName(profile) }), t('safety.blockConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('safety.block'),
        style: 'destructive',
        onPress: async () => {
          await reportAndBlock(client, profile.user_id, 'blocked_from_profile');
          router.back();
        },
      },
    ]);
  };

  const name = profile ? personName(profile) : '';
  const firstName = name.split(' ')[0];
  const airport = findAirportByIata(profile?.base_airport_iata ?? profile?.base_airport);
  const role = profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : profile?.role_type;
  const headline = [role, airlineName, airport?.iata ?? profile?.base_airport].filter(Boolean).join(' · ');
  const place = (city?: string | null, code?: string | null) => [city, code].filter(Boolean).join(', ');
  const placesLine = [
    profile?.residence_city ? t('onboarding.review.livesIn', { place: place(profile.residence_city, profile.residence_country_code) }) : null,
    profile?.hometown_city ? t('onboarding.review.from', { place: place(profile.hometown_city, profile.home_country_code) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const languages = (profile?.languages ?? []).map((code) => LANGUAGE_NAMES.get(code) ?? code);
  const since = profile?.created_at ? memberSinceWhen(profile.created_at, t) : '';
  const friends = relationship === 'friends';
  const pending = relationship === 'requested';
  const facts = [
    role ? { label: t('onboarding.crew.role'), value: role } : null,
    airlineName ? { label: t('onboarding.crew.airline'), value: airlineName } : null,
    airport || profile?.base_airport ? { label: t('profile.base'), value: airport ? `${airport.iata} · ${airport.city}` : (profile?.base_airport ?? '') } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar title={profile?.username ? `@${profile.username}` : name} onBack={() => router.back()} />
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
            {headline ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>{headline}</Text>
            ) : null}
            {profile.friend_id ? (
              <Text selectable style={{ fontFamily: fontFamily.monoMedium, fontSize: 11.5, color: theme.colors.accentText, marginTop: 2 }}>
                {`${t('friends.crewId')}: ${formatFriendId(profile.friend_id)}`}
              </Text>
            ) : null}
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
            ) : since ? (
              <MonoLabel style={{ fontSize: 10, color: theme.colors.textTertiary }}>{t('onboarding.review.memberSince', { when: since })}</MonoLabel>
            ) : null}
          </View>

          {params.matchTitle ? (
            <View style={{ backgroundColor: theme.colors.accentSubtle, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginTop: 16, gap: 3 }}>
              {params.matchLabel ? <MonoLabel style={{ fontSize: 10, color: theme.colors.accentText }}>{params.matchLabel}</MonoLabel> : null}
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>{params.matchTitle}</Text>
              {params.matchDetail ? (
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{params.matchDetail}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={{ gap: 8, marginTop: params.matchTitle ? 14 : 18 }}>
            {friends ? (
              <BigButton tone="lime" label={t('chat.message')} loading={opening} onPress={() => void message()} />
            ) : (
              <>
                <BigButton
                  tone={pending ? 'done' : 'lime'}
                  label={
                    pending
                      ? wave
                        ? t('profile.wavedSent')
                        : t('friends.requestSent')
                      : relationship === 'incoming'
                        ? t('profile.acceptOnFriends')
                        : wave
                          ? t('home.wave')
                          : t('network.connect')
                  }
                  loading={sending}
                  onPress={relationship === 'incoming' ? () => router.navigate(SCREENS.tabs.friends) : pending ? undefined : () => void connect()}
                />
                <BigButton tone="locked" height={46} label={t('chat.message')} icon={<LockGlyph color={theme.colors.textTertiary} />} />
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, textAlign: 'center' }}>
                  {wave ? t('profile.messageUnlocksWave', { name: firstName }) : t('profile.messageUnlocks', { name: firstName })}
                </Text>
              </>
            )}
          </View>

          {facts.length ? (
            <WhiteCard style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 4 }}>
              {facts.map((fact, index) => (
                <FactRow key={fact.label} label={fact.label} value={fact.value} last={index === facts.length - 1} />
              ))}
            </WhiteCard>
          ) : null}

          <View style={{ gap: 14, marginTop: 18 }}>
            {placesLine ? (
              <View style={{ gap: 8 }}>
                <MonoLabel style={{ fontSize: 10.5 }}>{t('onboarding.review.placesSection')}</MonoLabel>
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textPrimary }}>{placesLine}</Text>
              </View>
            ) : null}
            <PillGroup label={t('onboarding.review.languagesSection')} names={languages} />
            <PillGroup label={t('onboarding.review.activitiesSection')} names={activityNames} />
            <PillGroup label={t('onboarding.review.interestsSection')} names={interestNames} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 28,
              marginTop: 24,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: theme.colors.hairline,
            }}>
            <Text accessibilityRole="button" onPress={() => setReportOpen(true)} style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textSecondary }}>
              {t('safety.report')}
            </Text>
            <Text accessibilityRole="button" onPress={confirmBlock} style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: '#9B2C1F' }}>
              {t('safety.block')}
            </Text>
          </View>
        </ScrollView>
      )}
      {profile ? (
        <ReportSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          onSubmit={async (reason, details) => {
            await reportUser(client, { reason, details, reportedUserId: profile.user_id });
          }}
        />
      ) : null}
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
      <StandaloneNavPill active={null} />
    </Screen>
  );
}
