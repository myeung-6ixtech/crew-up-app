import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import Svg, { Path } from 'react-native-svg';
import { LANGUAGES } from '@crewup/shared';
import { AppIcon, Screen } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { Chevron, MonoLabel } from '@/features/onboarding/components/kit';
import { PhotoCircle } from '@/features/onboarding/components/PhotoCircle';
import { useAvatarPicker } from '@/features/onboarding/components/PhotoSourceSheet';
import { memberSinceWhen } from '@/features/onboarding/memberSince';
import { OnboardingRequestError, saveStep } from '@/features/onboarding/services/onboardingService';
import { GET_MY_PRIVATE } from '@/graphql/queries/onboarding';
import { useAuth, useSession } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { copyToClipboard } from '@/lib/clipboard';
import { formatFriendId } from '@/lib/friendId';
import { hapticSuccess } from '@/lib/haptics';
import { fetchActivityPreferences } from '@/services/activityService';
import { fetchAirlines } from '@/services/profileService';
import { fontFamily, shouldUppercaseLabels, useTheme, useThemedStyles } from '@/theme';

const LANGUAGE_NAMES = new Map(LANGUAGES.map(([code, name]) => [code, name]));

const GENDER_LABELS = {
  male: 'onboarding.about.genderMale',
  female: 'onboarding.about.genderFemale',
  unspecified: 'onboarding.about.genderUnspecified',
} as const;

type Row = { key: string; title: string; subtitle: string; onPress: () => void };

function RowChevron({ color }: { color: string }) {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14">
      <Path d="M1.5 1.5L6.5 7l-5 5.5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Same header as the preview. Each row opens its onboarding screen; saving returns here, never into the app. */
export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, userId } = useAuth();
  const { refreshProfile } = useSession();
  const styles = useThemedStyles((th) => ({
    topBar: {
      paddingTop: insets.top + 6,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    back: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: th.colors.field,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topTitle: { flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 16, color: th.colors.textPrimary },
    header: { alignItems: 'center', gap: 3, paddingTop: 8, paddingHorizontal: 24 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    name: { fontFamily: fontFamily.jakartaBold, fontSize: 20, letterSpacing: -0.4, color: th.colors.textPrimary },
    handle: { fontFamily: fontFamily.interRegular, fontSize: 13, color: th.colors.textSecondary },
    since: {
      fontFamily: fontFamily.monoMedium,
      fontSize: 10,
      letterSpacing: 0.8,
      color: th.colors.textTertiary,
      textTransform: shouldUppercaseLabels() ? 'uppercase' : 'none',
    },
    editBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: th.colors.ink,
      borderWidth: 3,
      borderColor: th.colors.ground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: { marginHorizontal: 16, backgroundColor: th.colors.card, borderRadius: 20, paddingHorizontal: 18 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: th.colors.hairline },
    rowTitle: { fontFamily: fontFamily.interMedium, fontSize: 15, color: th.colors.textPrimary },
    rowSubtitle: { fontFamily: fontFamily.interRegular, fontSize: 12.5, color: th.colors.textTertiary },
    crewId: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, paddingHorizontal: 34 },
    mono: { fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: th.colors.textTertiary },
    error: { fontFamily: fontFamily.interRegular, fontSize: 13, color: th.colors.statusOnDuty, textAlign: 'center', marginTop: 12 },
  }));

  const [airlineName, setAirlineName] = useState<string | null>(null);
  const [preferenceSummary, setPreferenceSummary] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState('');
  const photo = useAvatarPicker(profile?.avatar_file_id ?? null, async (fileId) => {
    setSaveError('');
    try {
      await saveStep('photo', { avatarFileId: fileId }, { advance: false });
      await refreshProfile();
    } catch (e) {
      setSaveError(e instanceof OnboardingRequestError ? e.message : t('onboarding.genericError'));
      throw e;
    }
  });

  useEffect(() => {
    if (!profile?.airline_id) {
      setAirlineName(null);
      return;
    }
    void fetchAirlines(client)
      .then((rows: { id: string; name: string }[]) =>
        setAirlineName(rows.find((row) => row.id === profile.airline_id)?.name ?? null),
      )
      .catch(() => setAirlineName(null));
  }, [client, profile?.airline_id]);

  useEffect(() => {
    if (!userId) return;
    void client
      .query<{ user_private_by_pk: { phone_e164: string | null } | null }>({
        query: GET_MY_PRIVATE,
        variables: { userId },
        fetchPolicy: 'network-only',
      })
      .then(({ data }) => setPhone(data?.user_private_by_pk?.phone_e164 ?? null))
      .catch(() => setPhone(null));
  }, [client, userId, profile]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void fetchActivityPreferences(client, userId)
        .then((rows) => setPreferenceSummary(rows.map((row) => row.name).join(', ')))
        .catch(() => setPreferenceSummary(''));
    }, [client, userId]),
  );

  const displayName = profile?.preferred_name || profile?.full_name || profile?.display_name || '';
  const airport = findAirportByIata(profile?.base_airport_iata ?? profile?.base_airport);
  const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');
  const place = (city?: string | null, code?: string | null) => [city, code].filter(Boolean).join(', ');
  const notProvided = t('onboarding.review.notProvided');
  const showGenderIcon =
    profile?.own_show_gender !== false && (profile?.visible_gender === 'male' || profile?.visible_gender === 'female');
  const since = profile?.created_at ? memberSinceWhen(profile.created_at, t) : '';
  const genderLabel = profile?.visible_gender ? t(GENDER_LABELS[profile.visible_gender]) : '';
  const phoneLabel = phone
    ? `${parsePhoneNumberFromString(phone)?.formatInternational() ?? phone} · ${t('profile.onlyYou')}`
    : notProvided;
  const crewId = profile?.friend_id ? formatFriendId(profile.friend_id) : null;

  const rows: Row[] = [
    {
      key: 'name_handle',
      title: t('onboarding.review.sections.nameHandle'),
      subtitle: join(profile?.full_name ?? profile?.display_name, profile?.username ? `@${profile.username}` : null),
      onPress: () => router.push(SCREENS.profile.editSection('name_handle')),
    },
    {
      key: 'display',
      title: t('onboarding.nameHandle.displayPrompt'),
      subtitle: displayName,
      onPress: () => router.push(SCREENS.profile.editSection('display')),
    },
    {
      key: 'about',
      title: t('onboarding.review.sections.about'),
      subtitle: genderLabel,
      onPress: () => router.push(SCREENS.profile.editSection('about')),
    },
    {
      key: 'languages',
      title: t('onboarding.about.languages'),
      subtitle: (profile?.languages ?? []).map((code) => LANGUAGE_NAMES.get(code) ?? code).join(', '),
      onPress: () => router.push(SCREENS.profile.editSection('languages')),
    },
    {
      key: 'interests',
      title: t('onboarding.about.intoTitle'),
      subtitle: preferenceSummary,
      onPress: () => router.push(SCREENS.profile.editSection('interests')),
    },
    {
      key: 'residence',
      title: t('onboarding.review.placesSection'),
      subtitle: join(
        place(profile?.residence_city, profile?.residence_country_code),
        place(profile?.hometown_city, profile?.home_country_code),
      ),
      onPress: () => router.push(SCREENS.profile.editSection('residence')),
    },
    {
      key: 'crew',
      title: t('onboarding.review.sections.crew'),
      subtitle: join(
        profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : null,
        airlineName,
        airport?.iata ?? profile?.base_airport,
      ),
      onPress: () => router.push(SCREENS.profile.editSection('crew')),
    },
  ];

  const renderRow = (row: Row, last: boolean) => (
    <Pressable
      key={row.key}
      accessibilityRole="button"
      accessibilityLabel={row.title}
      accessibilityHint={row.subtitle || notProvided}
      onPress={row.onPress}
      style={({ pressed }) => [styles.row, last ? null : styles.rowBorder, { opacity: pressed ? 0.6 : 1 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {row.subtitle || notProvided}
        </Text>
      </View>
      <RowChevron color={theme.colors.textTertiary} />
    </Pressable>
  );

  const onCopyCrewId = async () => {
    if (!crewId) return;
    await copyToClipboard(crewId);
    hapticSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.back')}
          onPress={() => router.back()}
          hitSlop={6}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]}>
          <Chevron direction="left" size={16} color={theme.colors.textPrimary} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.topTitle}>
          {t('profile.editTitle')}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.photo.change')}
            onPress={photo.open}
            disabled={photo.uploading}
            style={{ marginBottom: 6 }}>
            <PhotoCircle
              size={76}
              tone="lime"
              name={displayName}
              fileId={photo.previewUri ? null : profile?.avatar_file_id}
              localUri={photo.previewUri}
              uploading={photo.uploading}
              uploadingLabel=""
            />
            <View style={styles.editBadge}>
              <AppIcon name="edit" size={12} color={theme.colors.fill} />
            </View>
          </Pressable>
          {displayName ? (
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              {showGenderIcon ? (
                <AppIcon
                  name={profile?.visible_gender === 'female' ? 'genderFemale' : 'genderMale'}
                  size={16}
                  color={theme.colors.accentText}
                />
              ) : null}
            </View>
          ) : null}
          {profile?.username ? <Text style={styles.handle}>{`@${profile.username}`}</Text> : null}
          {since ? <Text style={styles.since}>{t('onboarding.review.memberSince', { when: since })}</Text> : null}
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>{rows.map((row, index) => renderRow(row, index === rows.length - 1))}</View>

        {crewId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.copyCrewId')}
            onPress={() => void onCopyCrewId()}
            style={styles.crewId}>
            <Text style={styles.mono}>{t('profile.crewId')}</Text>
            <Text style={[styles.mono, { color: copied ? theme.colors.accentText : theme.colors.textPrimary }]}>
              {copied ? t('profile.copied') : crewId}
            </Text>
          </Pressable>
        ) : null}

        <MonoLabel style={{ fontSize: 10.5, paddingTop: 16, paddingBottom: 8, paddingHorizontal: 34 }}>
          {t('onboarding.review.sections.private')}
        </MonoLabel>
        <View style={styles.card}>
          {renderRow(
            {
              key: 'phone',
              title: t('onboarding.review.sections.phone'),
              subtitle: phoneLabel,
              onPress: () => router.push(SCREENS.profile.editSection('phone')),
            },
            true,
          )}
        </View>

        {photo.error || saveError ? <Text style={styles.error}>{saveError || photo.error}</Text> : null}
      </ScrollView>
      {photo.sheet}
    </Screen>
  );
}
