import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@crewup/shared';
import { AppIcon } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { useApolloClient } from '@/lib/apolloHooks';
import { useAuth } from '@/hooks/useSession';
import { hapticError } from '@/lib/haptics';
import { fetchActivityPreferences } from '@/services/activityService';
import { fetchAirlines } from '@/services/profileService';
import { fontFamily, shouldUppercaseLabels, useTheme, useThemedStyles } from '@/theme';
import type { ActivityPreference } from '@/types/domain';
import { MonoLabel } from '../components/kit';
import { PhotoCircle } from '../components/PhotoCircle';
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
    card: {
      backgroundColor: th.colors.card,
      borderRadius: 22,
      paddingTop: 22,
      paddingHorizontal: 18,
      paddingBottom: 6,
      shadowColor: '#0E1113',
      shadowOpacity: 0.06,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3,
    },
    header: {
      alignItems: 'center',
      gap: 4,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: th.colors.hairline,
    },
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
    section: { gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: th.colors.hairline },
    sectionLast: { borderBottomWidth: 0 },
    line: { fontFamily: fontFamily.interMedium, fontSize: 13.5, lineHeight: 19, color: th.colors.textPrimary },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    pill: { backgroundColor: th.colors.fill, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    pillText: { fontFamily: fontFamily.interMedium, fontSize: 12, color: th.colors.onFill },
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
  const residing = [profile?.residence_city, profile?.residence_country_code].filter(Boolean).join(', ');
  const hometown = [profile?.hometown_city, profile?.home_country_code].filter(Boolean).join(', ');
  const languages = (profile?.languages ?? []).map((code) => LANGUAGE_NAMES.get(code) ?? code);
  const role = profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : '';
  const base = airport?.iata ?? profile?.base_airport_iata ?? '';
  const since = profile?.created_at ? memberSinceWhen(profile.created_at, t) : '';
  const activityNames = preferences.filter((item) => item.kind === 'activity').map((item) => item.name);
  const interestNames = preferences.filter((item) => item.kind === 'interest').map((item) => item.name);

  const places = [
    residing ? t('onboarding.review.livesIn', { place: residing }) : '',
    hometown ? t('onboarding.review.from', { place: hometown }) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const crewLine = [role, airlineName, base].filter(Boolean).join(' · ');
  const sections: { key: string; label: string; line?: string; pills?: string[] }[] = [
    crewLine ? { key: 'crew', label: t('onboarding.review.crewSection'), line: crewLine } : null,
    places ? { key: 'places', label: t('onboarding.review.placesSection'), line: places } : null,
    languages.length ? { key: 'languages', label: t('onboarding.review.languagesSection'), pills: languages } : null,
    activityNames.length ? { key: 'activities', label: t('onboarding.review.activitiesSection'), pills: activityNames } : null,
    interestNames.length ? { key: 'interests', label: t('onboarding.review.interestsSection'), pills: interestNames } : null,
  ].filter((section): section is NonNullable<typeof section> => section !== null);

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
      titleStyle={prefilledFromBeta ? undefined : { marginBottom: -10 }}
      banner={prefilledFromBeta ? t('onboarding.review.prefilledBanner') : undefined}
      headerLabel={prefilledFromBeta ? t('onboarding.review.betaEnded') : undefined}
      primaryLabel={prefilledFromBeta ? t('onboarding.review.looksGood') : t('onboarding.review.done')}
      onPrimary={() => void onContinue()}
      primaryLoading={saving}
      error={formError}>
      <View style={styles.card}>
        <View style={styles.header}>
          <PhotoCircle size={76} tone="lime" name={displayName} fileId={profile?.avatar_file_id} />
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
        {sections.map((section, index) => (
          <View key={section.key} style={[styles.section, index === sections.length - 1 ? styles.sectionLast : null]}>
            <MonoLabel style={{ fontSize: 10, color: theme.colors.textTertiary }}>{section.label}</MonoLabel>
            {section.pills ? (
              <View style={styles.pills}>
                {section.pills.map((name) => (
                  <View key={name} style={styles.pill}>
                    <Text style={styles.pillText}>{name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.line}>{section.line}</Text>
            )}
          </View>
        ))}
      </View>
    </StepScaffold>
  );
}
