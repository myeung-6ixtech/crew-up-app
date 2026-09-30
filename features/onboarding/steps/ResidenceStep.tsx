import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AboutSchema, ResidenceSchema } from '@crewup/shared';
import { Subtitle, Title } from '@/components/ui';
import { UPDATE_PROFILE } from '@/graphql/mutations/profile';
import { useAuth, useSession } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { getAboutDraft } from '../aboutDraft';
import { HometownPicker, type HometownValue } from '../components/HometownPicker';
import { StepScaffold } from '../components/StepScaffold';
import { useStepForm } from '../hooks/useStepForm';
import { onboardingHref, type StepContext } from '../navigation';
import { OnboardingRequestError, saveStep } from '../services/onboardingService';

export function ResidenceStep({ context }: { context: StepContext }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const client = useApolloClient();
  const { profile, userId } = useAuth();
  const { refreshProfile } = useSession();
  const inFlow = context === 'flow';
  const [savingPlace, setSavingPlace] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [homeError, setHomeError] = useState('');
  const { form, saving, formError } = useStepForm(
    'residence',
    ResidenceSchema,
    {
      residenceCountryCode: profile?.residence_country_code ?? '',
      residenceCity: profile?.residence_city ?? '',
    },
    context,
  );
  const { setValue, watch, getValues, setError } = form;
  const residenceCity = watch('residenceCity');
  const residenceCountryCode = watch('residenceCountryCode');
  const cityError = form.formState.errors.residenceCity?.message;
  const countryError = form.formState.errors.residenceCountryCode?.message;
  const liveError =
    typeof cityError === 'string' ? cityError : typeof countryError === 'string' ? countryError : undefined;
  const [hometown, setHometown] = useState<HometownValue | null>(
    profile?.hometown_city
      ? {
          name: profile.hometown_city,
          countryCode: profile.home_country_code ?? null,
          latitude: profile.own_hometown_latitude ?? null,
          longitude: profile.own_hometown_longitude ?? null,
        }
      : null,
  );

  const onNext = async () => {
    setPlaceError('');
    setHomeError('');
    const residence = ResidenceSchema.safeParse(getValues());
    if (!residence.success) {
      setError('residenceCity', {
        message: residence.error.issues[0]?.message ?? t('onboarding.residence.chooseCity'),
      });
    }
    if (!hometown?.name || !hometown.countryCode) {
      setHomeError(t('onboarding.residence.chooseCity'));
    }
    if (!residence.success || !hometown?.name || !hometown.countryCode) {
      hapticError();
      return;
    }

    const draft = getAboutDraft();
    const about = AboutSchema.safeParse({
      dateOfBirth: draft?.dateOfBirth || profile?.own_date_of_birth || '',
      languages: draft?.languages?.length ? draft.languages : (profile?.languages ?? []),
      homeCountryCode: hometown.countryCode,
      hometownCity: hometown.name,
      hometownLatitude: hometown.latitude,
      hometownLongitude: hometown.longitude,
    });
    if (!about.success) {
      hapticError();
      setPlaceError(about.error.issues[0]?.message ?? t('onboarding.genericError'));
      return;
    }

    setSavingPlace(true);
    try {
      if (userId) {
        await client.mutate({
          mutation: UPDATE_PROFILE,
          variables: {
            userId,
            set: {
              hometown_latitude: hometown.latitude,
              hometown_longitude: hometown.longitude,
              ...(draft
                ? { gender: draft.gender, show_gender: draft.showGender }
                : {}),
            },
          },
        });
      }
      await saveStep('about', about.data, { advance: inFlow });
      await saveStep('residence', residence.data, { advance: inFlow });
      await refreshProfile();
      hapticSuccess();
      if (inFlow) router.push(onboardingHref('crew'));
      else if (router.canGoBack()) router.back();
      else router.replace(onboardingHref('review'));
    } catch (error) {
      hapticError();
      if (error instanceof OnboardingRequestError) setPlaceError(error.message);
      else setPlaceError(t('onboarding.about.hometownFailed'));
    } finally {
      setSavingPlace(false);
    }
  };

  return (
    <StepScaffold
      step="residence"
      context={context}
      primaryLabel={inFlow ? t('onboarding.next') : t('onboarding.save')}
      onPrimary={() => void onNext()}
      primaryLoading={saving || savingPlace}
      error={formError || placeError}>
      <Title style={{ marginBottom: 20 }}>{t('onboarding.residence.title')}</Title>
      <Subtitle>{t('onboarding.residence.liveHint')}</Subtitle>
      <HometownPicker
        label={t('onboarding.residence.residingCity')}
        allowClear={false}
        error={liveError}
        value={
          residenceCity
            ? { name: residenceCity, countryCode: residenceCountryCode || null, latitude: null, longitude: null }
            : null
        }
        onChange={(place) => {
          setValue('residenceCity', place?.name ?? '', { shouldDirty: true, shouldValidate: true });
          setValue('residenceCountryCode', place?.countryCode ?? '', { shouldDirty: true, shouldValidate: true });
        }}
      />
      <View style={{ marginTop: theme.spacing.lg }}>
        <Title style={{ marginBottom: 20 }}>{t('onboarding.about.hometown')}</Title>
        <Subtitle>{t('onboarding.residence.hometownHint')}</Subtitle>
        <HometownPicker
          label={t('onboarding.residence.homeCity')}
          allowClear={false}
          error={homeError}
          value={hometown}
          onChange={setHometown}
        />
      </View>
    </StepScaffold>
  );
}
