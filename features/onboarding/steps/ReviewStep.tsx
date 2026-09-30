import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, countryName, type OnboardingStep } from '@crewup/shared';
import { Avatar, BodyText, Button, SectionLabel } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { GET_MY_PRIVATE } from '@/graphql/queries/onboarding';
import { useApolloClient } from '@/lib/apolloHooks';
import { useAuth } from '@/hooks/useSession';
import { fetchAirlines } from '@/services/profileService';
import { useTheme, useThemedStyles } from '@/theme';
import { StepScaffold } from '../components/StepScaffold';
import { useOnboardingState } from '../hooks/useOnboardingState';
import { useStepSave } from '../hooks/useStepForm';
import { reviewEditHref } from '../navigation';
import { hapticError } from '@/lib/haptics';
import { incompleteFields } from '../profileInput';

const LANGUAGE_NAMES = new Map(LANGUAGES.map(([code, name]) => [code, name]));

type Section = {
  key: string;
  step: OnboardingStep;
  lines: (string | null | undefined)[];
  fields: string[];
};

export function ReviewStep() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const client = useApolloClient();
  const { profile, userId } = useAuth();
  const { mode, prefilledFromBeta } = useOnboardingState();
  const { save, saving, formError, setFormError } = useStepSave('review', 'flow');
  const [phone, setPhone] = useState<string | null>(null);
  const [airlineName, setAirlineName] = useState<string | null>(null);
  const styles = useThemedStyles((th) => ({
    section: {
      borderWidth: 1,
      borderColor: th.colors.hairline,
      borderRadius: th.radius.input,
      padding: th.spacing.md,
      marginBottom: th.spacing.md,
      backgroundColor: th.colors.bgSurface,
    },
    sectionMissing: { borderColor: th.colors.statusOnDuty },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  }));

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
  }, [client, userId]);

  useEffect(() => {
    if (!profile?.airline_id) return;
    void fetchAirlines(client)
      .then((rows: { id: string; name: string }[]) => setAirlineName(rows.find((row) => row.id === profile.airline_id)?.name ?? null))
      .catch(() => setAirlineName(null));
  }, [client, profile?.airline_id]);

  const missing = useMemo(() => incompleteFields(profile), [profile]);
  const airport = findAirportByIata(profile?.base_airport_iata);

  const sections: Section[] = [
    {
      key: 'nameHandle',
      step: 'name_handle',
      lines: [profile?.full_name, profile?.full_name_native, profile?.preferred_name, profile?.username ? `@${profile.username}` : null],
      fields: ['fullName', 'username'],
    },
    {
      key: 'about',
      step: 'about',
      lines: [
        profile?.own_date_of_birth,
        profile?.visible_gender === 'male'
          ? t('onboarding.about.genderMale')
          : profile?.visible_gender === 'female'
            ? t('onboarding.about.genderFemale')
            : profile?.visible_gender === 'unspecified'
              ? t('onboarding.about.genderUnspecified')
              : null,
        (profile?.languages ?? []).map((code) => LANGUAGE_NAMES.get(code) ?? code).join(', '),
      ],
      fields: ['dateOfBirth', 'languages'],
    },
    {
      key: 'residence',
      step: 'residence',
      lines: [
        [profile?.residence_city, countryName(profile?.residence_country_code)].filter(Boolean).join(', '),
        [profile?.hometown_city, countryName(profile?.home_country_code)].filter(Boolean).join(', '),
      ],
      fields: ['residenceCountryCode', 'residenceCity', 'homeCountryCode'],
    },
    {
      key: 'crew',
      step: 'crew',
      lines: [
        profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : null,
        airlineName,
        airport ? `${airport.iata} · ${airport.city}` : profile?.base_airport_iata,
      ],
      fields: ['crewRole', 'airlineId', 'baseAirportIata'],
    },
    { key: 'phone', step: 'phone', lines: [phone], fields: [] },
    {
      key: 'photo',
      step: 'photo',
      lines: [profile?.avatar_file_id ? t('onboarding.review.photoAdded') : null],
      fields: [],
    },
  ];

  const primaryLabel =
    mode === 'beta'
      ? t('onboarding.review.joinBeta')
      : prefilledFromBeta
        ? t('onboarding.review.confirmContinue')
        : t('onboarding.review.continue');

  const onContinue = async () => {
    if (missing.size) {
      hapticError();
      setFormError(t('onboarding.review.incomplete'));
      return;
    }
    await save({});
  };

  return (
    <StepScaffold
      step="review"
      context="flow"
      title={t('onboarding.review.title')}
      subtitle={t('onboarding.review.subtitle')}
      banner={prefilledFromBeta ? t('onboarding.review.prefilledBanner') : undefined}
      primaryLabel={primaryLabel}
      onPrimary={() => void onContinue()}
      primaryLoading={saving}
      error={formError}>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Avatar
          name={profile?.preferred_name ?? profile?.full_name ?? undefined}
          fileId={profile?.avatar_file_id}
          size="xl"
        />
      </View>
      {sections.map((section) => {
        const lines = section.lines.filter((line): line is string => Boolean(line));
        const isMissing = section.fields.some((field) => missing.has(field));
        return (
          <View key={section.key} style={[styles.section, isMissing ? styles.sectionMissing : null]}>
            <View style={styles.sectionHeader}>
              <SectionLabel>{t(`onboarding.review.sections.${section.key}`)}</SectionLabel>
              <Button
                label={t('onboarding.review.edit')}
                variant="ghost"
                noTopMargin
                onPress={() => router.push(reviewEditHref(section.step))}
              />
            </View>
            {lines.length ? (
              lines.map((line) => <BodyText key={line}>{line}</BodyText>)
            ) : (
              <BodyText muted>{t('onboarding.review.notProvided')}</BodyText>
            )}
          </View>
        );
      })}
    </StepScaffold>
  );
}
