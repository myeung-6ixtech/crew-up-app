import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, countryName } from '@crewup/shared';
import { ProfilePills } from '@/components/profile/ProfilePills';
import { AppIcon, Avatar, BodyText, DisplaySmText } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { useApolloClient } from '@/lib/apolloHooks';
import { useAuth } from '@/hooks/useSession';
import { hapticError } from '@/lib/haptics';
import { fetchActivityPreferences } from '@/services/activityService';
import { fetchAirlines } from '@/services/profileService';
import { useTheme, useThemedStyles } from '@/theme';
import type { ActivityPreference } from '@/types/domain';
import { StepScaffold } from '../components/StepScaffold';
import { useOnboardingState } from '../hooks/useOnboardingState';
import { useStepSave } from '../hooks/useStepForm';
import { memberSinceWhen } from '../memberSince';
import { incompleteFields } from '../profileInput';

const LANGUAGE_NAMES = new Map(LANGUAGES.map(([code, name]) => [code, name]));

const MISSING_LABELS: Record<string, string> = {
  fullName: 'your name',
  username: 'a username',
  dateOfBirth: 'your date of birth',
  languages: 'a language',
  homeCountryCode: 'your home city',
  residenceCountryCode: 'your residing city',
  residenceCity: 'your residing city',
  crewRole: 'your crew role',
  airlineId: 'your airline',
  baseAirportIata: 'your base',
};

export function ReviewStep() {
  const { t } = useTranslation();
  const theme = useTheme();
  const client = useApolloClient();
  const { profile, userId } = useAuth();
  const { prefilledFromBeta } = useOnboardingState();
  const { save, saving, formError, setFormError } = useStepSave('review', 'flow');
  const [airlineName, setAirlineName] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<ActivityPreference[]>([]);
  const styles = useThemedStyles((th) => ({
    header: { alignItems: 'center', marginBottom: th.spacing.sm },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: th.spacing.xs,
      marginTop: th.spacing.md,
    },
    handle: { textAlign: 'center', marginTop: th.spacing.xs },
    since: { textAlign: 'center', marginTop: th.spacing.xs },
    section: {
      alignSelf: 'stretch',
      marginTop: th.spacing.md,
      padding: th.spacing.md,
      borderRadius: th.radius.card,
      borderWidth: 1,
      borderColor: th.colors.hairline,
      backgroundColor: th.colors.bgSurface,
      gap: th.spacing.sm,
    },
    sectionTitle: {
      ...th.typography.label,
      color: th.colors.textTertiary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: th.spacing.md,
    },
    rowValue: { flex: 1, textAlign: 'right' },
  }));

  useEffect(() => {
    if (!profile?.airline_id) return;
    void fetchAirlines(client)
      .then((rows: { id: string; name: string }[]) => setAirlineName(rows.find((row) => row.id === profile.airline_id)?.name ?? null))
      .catch(() => setAirlineName(null));
  }, [client, profile?.airline_id]);

  useEffect(() => {
    if (!userId) return;
    void fetchActivityPreferences(client, userId)
      .then(setPreferences)
      .catch(() => setPreferences([]));
  }, [client, userId]);

  const missing = useMemo(() => incompleteFields(profile), [profile]);
  const airport = findAirportByIata(profile?.base_airport_iata);
  const displayName = profile?.preferred_name || profile?.display_name || profile?.full_name || '';
  const showGenderIcon = profile?.own_show_gender !== false && (profile?.visible_gender === 'male' || profile?.visible_gender === 'female');
  const residing = [profile?.residence_city, countryName(profile?.residence_country_code)].filter(Boolean).join(', ');
  const hometown = [profile?.hometown_city, countryName(profile?.home_country_code)].filter(Boolean).join(', ');
  const languages = (profile?.languages ?? []).map((code) => LANGUAGE_NAMES.get(code) ?? code);
  const role = profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : '';
  const base = airport ? `${airport.iata} · ${airport.city}` : profile?.base_airport_iata ?? '';
  const since = profile?.created_at ? memberSinceWhen(profile.created_at, t) : '';
  const activityNames = preferences.filter((item) => item.kind === 'activity').map((item) => item.name);
  const interestNames = preferences.filter((item) => item.kind === 'interest').map((item) => item.name);

  const onContinue = async () => {
    if (missing.size) {
      hapticError();
      const items = [...new Set([...missing].map((field) => MISSING_LABELS[field] ?? field))];
      setFormError(t('onboarding.review.incomplete', { items: items.join(', ') }));
      return;
    }
    await save({});
  };

  return (
    <StepScaffold
      step="review"
      context="flow"
      title={t('onboarding.review.title')}
      banner={prefilledFromBeta ? t('onboarding.review.prefilledBanner') : undefined}
      primaryLabel={t('onboarding.review.done')}
      onPrimary={() => void onContinue()}
      primaryLoading={saving}
      error={formError}>
      <View style={styles.header}>
        <Avatar name={displayName || undefined} fileId={profile?.avatar_file_id} size="xl" />
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
        {since ? <BodyText muted style={styles.since}>{t('onboarding.review.memberSince', { when: since })}</BodyText> : null}
      </View>
      {role || airlineName || base ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('onboarding.review.crewSection')}</Text>
          {role ? (
            <View style={styles.row}>
              <BodyText muted>{t('onboarding.crew.role')}</BodyText>
              <BodyText style={styles.rowValue}>{role}</BodyText>
            </View>
          ) : null}
          {airlineName ? (
            <View style={styles.row}>
              <BodyText muted>{t('onboarding.crew.airline')}</BodyText>
              <BodyText style={styles.rowValue}>{airlineName}</BodyText>
            </View>
          ) : null}
          {base ? (
            <View style={styles.row}>
              <BodyText muted>{t('onboarding.crew.base')}</BodyText>
              <BodyText style={styles.rowValue}>{base}</BodyText>
            </View>
          ) : null}
        </View>
      ) : null}
      {residing || hometown ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('onboarding.review.placesSection')}</Text>
          {residing ? (
            <View style={styles.row}>
              <BodyText muted>{t('onboarding.residence.residingCity')}</BodyText>
              <BodyText style={styles.rowValue}>{residing}</BodyText>
            </View>
          ) : null}
          {hometown ? (
            <View style={styles.row}>
              <BodyText muted>{t('onboarding.residence.homeCity')}</BodyText>
              <BodyText style={styles.rowValue}>{hometown}</BodyText>
            </View>
          ) : null}
        </View>
      ) : null}
      {languages.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('onboarding.review.languagesSection')}</Text>
          <ProfilePills names={languages} />
        </View>
      ) : null}
      {activityNames.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('onboarding.review.activitiesSection')}</Text>
          <ProfilePills names={activityNames} />
        </View>
      ) : null}
      {interestNames.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('onboarding.review.interestsSection')}</Text>
          <ProfilePills names={interestNames} />
        </View>
      ) : null}
    </StepScaffold>
  );
}
