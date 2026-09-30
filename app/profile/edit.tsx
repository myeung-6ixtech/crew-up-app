import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@crewup/shared';
import { useApolloClient } from '@/lib/apolloHooks';
import { CrewIdCard } from '@/components/friends/CrewIdCard';
import { Screen, Avatar, BodyText, AppIcon, DisplaySmText, ListRow, SectionLabel } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { GET_MY_PRIVATE } from '@/graphql/queries/onboarding';
import { useAuth, useSession } from '@/hooks/useSession';
import { fetchActivityPreferences } from '@/services/activityService';
import { fetchAirlines } from '@/services/profileService';
import { saveStep, OnboardingRequestError } from '@/features/onboarding/services/onboardingService';
import { memberSinceWhen } from '@/features/onboarding/memberSince';
import { pickAndUploadAvatar } from '@/features/onboarding/steps';
import { useThemedStyles, useTheme } from '@/theme';

const LANGUAGE_NAMES = new Map(LANGUAGES.map(([code, name]) => [code, name]));

const GENDER_LABELS = {
  male: 'onboarding.about.genderMale',
  female: 'onboarding.about.genderFemale',
  unspecified: 'onboarding.about.genderUnspecified',
} as const;

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const theme = useTheme();
  const { profile, userId } = useAuth();
  const { refreshProfile } = useSession();
  const styles = useThemedStyles((t) => ({
    scroll: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl },
    avatarSection: { alignItems: 'center', marginBottom: t.spacing.xl },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.xs,
      marginTop: t.spacing.md,
    },
    handle: { textAlign: 'center', marginTop: t.spacing.xs },
    since: { textAlign: 'center', marginTop: t.spacing.xs },
    avatarPress: { position: 'relative' },
    editBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 36,
      height: 36,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.bgSurfaceRaised,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: { marginBottom: t.spacing.xl },
  }));

  const [airlineName, setAirlineName] = useState<string | null>(null);
  const [preferenceSummary, setPreferenceSummary] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);

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

  const onAvatar = async () => {
    setError('');
    setUploading(true);
    try {
      const result = await pickAndUploadAvatar();
      if (result.status === 'too_large') setError(t('onboarding.photo.tooLarge'));
      if (result.status !== 'uploaded') return;
      setAvatarPreviewUri(result.uri);
      await saveStep('photo', { avatarFileId: result.fileId }, { advance: false });
      await refreshProfile();
    } catch (e) {
      setAvatarPreviewUri(null);
      setError(e instanceof OnboardingRequestError ? e.message : t('onboarding.genericError'));
    } finally {
      setUploading(false);
    }
  };

  const displayName = profile?.preferred_name || profile?.full_name || profile?.display_name || '';
  const airport = findAirportByIata(profile?.base_airport_iata ?? profile?.base_airport);
  const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');
  const notProvided = t('onboarding.review.notProvided');
  const showGenderIcon =
    profile?.own_show_gender !== false && (profile?.visible_gender === 'male' || profile?.visible_gender === 'female');
  const since = profile?.created_at ? memberSinceWhen(profile.created_at, t) : '';
  const genderLabel = profile?.visible_gender ? t(GENDER_LABELS[profile.visible_gender]) : '';

  const rows: { key: string; title: string; subtitle: string; onPress: () => void }[] = [
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
      subtitle: join(profile?.residence_city, profile?.hometown_city),
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

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <Pressable
            onPress={() => void onAvatar()}
            disabled={uploading}
            style={styles.avatarPress}
            accessibilityLabel={t('onboarding.photo.change')}>
            <Avatar name={displayName} fileId={profile?.avatar_file_id} localUri={avatarPreviewUri} size="xl" />
            <View style={styles.editBadge}>
              <AppIcon name="edit" size={18} color={theme.colors.accentText} />
            </View>
          </Pressable>
          {displayName ? (
            <View style={styles.nameRow}>
              <DisplaySmText>{displayName}</DisplaySmText>
              {showGenderIcon ? (
                <AppIcon
                  name={profile?.visible_gender === 'female' ? 'genderFemale' : 'genderMale'}
                  size={18}
                  color={theme.colors.accentText}
                />
              ) : null}
            </View>
          ) : null}
          {profile?.username ? <BodyText muted style={styles.handle}>{`@${profile.username}`}</BodyText> : null}
          {since ? (
            <BodyText muted style={styles.since}>
              {t('onboarding.review.memberSince', { when: since })}
            </BodyText>
          ) : null}
          <BodyText muted style={styles.since}>
            {uploading ? t('onboarding.photo.uploading') : t('home.editProfilePhotoHint')}
          </BodyText>
        </View>

        <View style={styles.section}>
          {rows.map((row) => (
            <ListRow
              key={row.key}
              inset={false}
              title={row.title}
              subtitle={row.subtitle || notProvided}
              onPress={row.onPress}
              right={<AppIcon name="chevronRight" size={20} color={theme.colors.textTertiary} />}
            />
          ))}
        </View>

        <View style={styles.section}>
          <CrewIdCard friendId={profile?.friend_id} />
        </View>

        <SectionLabel>{t('onboarding.review.sections.private')}</SectionLabel>
        <ListRow
          inset={false}
          title={t('onboarding.review.sections.phone')}
          subtitle={phone || notProvided}
          onPress={() => router.push(SCREENS.profile.editSection('phone'))}
          right={<AppIcon name="chevronRight" size={20} color={theme.colors.textTertiary} />}
        />

        {error ? <BodyText style={{ color: theme.colors.statusOnDuty }}>{error}</BodyText> : null}
      </ScrollView>
    </Screen>
  );
}
