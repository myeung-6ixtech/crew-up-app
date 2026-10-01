import { useMemo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import { z } from 'zod';
import {
  AboutSchema,
  DateOfBirthSchema,
  LANGUAGE_CODES,
  LANGUAGES,
  MAXIMUM_AGE,
  MINIMUM_AGE,
  languageFromLocale,
} from '@crewup/shared';
import { UPDATE_PROFILE } from '@/graphql/mutations/profile';
import { useAuth, useSession } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import { getAboutDraft, setAboutDraft, type AboutDraft, type Gender } from '../aboutDraft';
import { DobField } from '../components/DobField';
import { InterestsFields } from '../components/InterestsFields';
import { ChoicePill, MonoLabel } from '../components/kit';
import { LanguagePills } from '../components/LanguagePills';
import { StepScaffold } from '../components/StepScaffold';
import { useActivitySelection } from '../hooks/useActivitySelection';
import { useStepSave } from '../hooks/useStepForm';
import { onboardingHref, type StepContext } from '../navigation';

const GENDERS = ['male', 'female', 'unspecified'] as const;

const DetailsSchema = z.object({
  dateOfBirth: DateOfBirthSchema,
  gender: z.enum(GENDERS, { error: 'Choose a gender' }),
  showGender: z.boolean(),
});

const LanguagesSchema = z.object({
  languages: z
    .array(z.string().refine((code) => LANGUAGE_CODES.has(code), 'Unsupported language'))
    .min(1, 'Choose at least one language')
    .max(10, 'Choose up to 10 languages'),
});

type AboutForm = {
  dateOfBirth: string;
  gender: Gender | '';
  showGender: boolean;
  languages: string[];
};

const GENDER_LABELS: Record<Gender, string> = {
  male: 'onboarding.about.genderMale',
  female: 'onboarding.about.genderFemale',
  unspecified: 'onboarding.about.genderUnspecified',
};

/** Calendar date (YYYY-MM-DD) ↔ local Date, without timezone shifts. */
function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromIsoDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function yearsAgo(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

export function AboutStep({ context }: { context: StepContext }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const client = useApolloClient();
  const { profile, userId } = useAuth();
  const { refreshProfile } = useSession();
  const { save, saving, formError } = useStepSave('about', context);
  const inFlow = context === 'flow';
  const remembered = getAboutDraft();
  const [phase, setPhase] = useState<'details' | 'languages' | 'into'>(() =>
    inFlow && (remembered?.screen === 'languages' || remembered?.screen === 'into') ? remembered.screen : 'details',
  );
  const interests = useActivitySelection(inFlow ? userId : null);
  const [phaseError, setPhaseError] = useState('');
  const [savingGender, setSavingGender] = useState(false);
  const deviceLanguage = useMemo(
    () => languageFromLocale(Localization.getLocales()[0]?.languageTag),
    [],
  );
  const form = useForm<AboutForm>({
    defaultValues: {
      dateOfBirth: remembered?.dateOfBirth || profile?.own_date_of_birth || '',
      gender: remembered?.gender || profile?.visible_gender || '',
      showGender: remembered?.showGender ?? profile?.own_show_gender ?? true,
      languages: remembered?.languages?.length
        ? remembered.languages
        : profile?.languages?.length
          ? profile.languages
          : deviceLanguage
            ? [deviceLanguage]
            : [],
    },
  });
  const { control, getValues, setError } = form;

  const remember = (screen: AboutDraft['screen'], values: AboutForm, gender: Gender) => {
    setAboutDraft({
      screen,
      dateOfBirth: values.dateOfBirth,
      gender,
      showGender: values.showGender,
      languages: values.languages,
    });
  };

  const persistGender = async (gender: Gender, visible: boolean) => {
    if (!userId) return;
    await client.mutate({
      mutation: UPDATE_PROFILE,
      variables: { userId, set: { gender, show_gender: visible } },
    });
    await refreshProfile();
  };

  const onDetailsNext = async () => {
    const values = getValues();
    const parsed = DetailsSchema.safeParse(values);
    if (!parsed.success) {
      hapticError();
      const issue = parsed.error.issues[0];
      const field = issue?.path[0];
      if (field === 'dateOfBirth' || field === 'gender') setError(field, { message: issue.message });
      else setPhaseError(issue?.message ?? t('onboarding.genericError'));
      return;
    }
    setSavingGender(true);
    setPhaseError('');
    try {
      await persistGender(parsed.data.gender, parsed.data.showGender);
      remember('languages', values, parsed.data.gender);
      if (inFlow) setPhase('languages');
      else await saveLanguages(parsed.data.gender, values);
    } catch {
      hapticError();
      setPhaseError(t('onboarding.genericError'));
    } finally {
      setSavingGender(false);
    }
  };

  const saveLanguages = async (gender: Gender, values: AboutForm) => {
    const languages = LanguagesSchema.safeParse({ languages: values.languages });
    if (!languages.success) {
      hapticError();
      const message = languages.error.issues[0]?.message ?? t('onboarding.genericError');
      setError('languages', { message });
      if (!inFlow) setPhaseError(message);
      return;
    }
    remember('languages', values, gender);
    const about = AboutSchema.safeParse({
      dateOfBirth: values.dateOfBirth,
      languages: languages.data.languages,
      homeCountryCode: profile?.home_country_code ?? '',
      hometownCity: profile?.hometown_city ?? null,
      hometownLatitude: profile?.own_hometown_latitude ?? null,
      hometownLongitude: profile?.own_hometown_longitude ?? null,
    });
    if (!about.success) {
      if (inFlow) {
        router.push(onboardingHref('residence'));
        return;
      }
      hapticError();
      setPhaseError(about.error.issues[0]?.message ?? t('onboarding.genericError'));
      return;
    }
    await save(about.data, (field, message) => {
      if (field === 'dateOfBirth' || field === 'languages') setError(field, { message });
    });
  };

  const onLanguagesNext = async () => {
    const values = getValues();
    const gender = DetailsSchema.safeParse(values).data?.gender;
    if (!gender) {
      setPhase('details');
      return;
    }
    const languages = LanguagesSchema.safeParse({ languages: values.languages });
    if (!languages.success) {
      hapticError();
      setError('languages', { message: languages.error.issues[0]?.message ?? t('onboarding.genericError') });
      return;
    }
    setPhaseError('');
    remember('into', values, gender);
    setPhase('into');
  };

  const finishAbout = async () => {
    const values = getValues();
    const gender = DetailsSchema.safeParse(values).data?.gender;
    if (!gender) {
      setPhase('details');
      return;
    }
    setPhaseError('');
    await saveLanguages(gender, values);
  };

  const onIntoNext = async () => {
    try {
      await interests.save();
      await finishAbout();
    } catch {
      hapticError();
      setPhaseError(t('onboarding.genericError'));
    }
  };

  const errorText = (message?: string) =>
    message ? (
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.statusOnDuty, marginTop: 6, paddingLeft: 4 }}>
        {message}
      </Text>
    ) : null;

  const genderField = (
    <Controller
      control={control}
      name="gender"
      render={({ field, fieldState }) => (
        <>
          <MonoLabel style={{ marginTop: 30 }}>{t('onboarding.about.gender')}</MonoLabel>
          <View accessibilityRole="radiogroup" style={{ gap: 8, marginTop: 10 }}>
            {GENDERS.map((gender) => (
              <ChoicePill
                key={gender}
                label={t(GENDER_LABELS[gender])}
                selected={field.value === gender}
                onPress={() => field.onChange(gender)}
              />
            ))}
          </View>
          {errorText(fieldState.error?.message)}
        </>
      )}
    />
  );

  const showGenderField = (
    <Controller
      control={control}
      name="showGender"
      render={({ field }) => (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: field.value }}
          onPress={() => field.onChange(!field.value)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: theme.colors.hairline,
          }}>
          <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
            {t('onboarding.about.showGender')}
          </Text>
          <Switch
            value={field.value}
            onValueChange={field.onChange}
            trackColor={{ true: theme.colors.fill, false: theme.colors.track }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={theme.colors.track}
          />
        </Pressable>
      )}
    />
  );

  const languagesField = (
    <Controller
      control={control}
      name="languages"
      render={({ field, fieldState }) => (
        <LanguagePills value={field.value ?? []} onChange={field.onChange} error={fieldState.error?.message} />
      )}
    />
  );

  if (inFlow && phase === 'into') {
    return (
      <StepScaffold
        step="about"
        context={context}
        progressCurrent={5}
        onLeadingPress={() => {
          setPhaseError('');
          const values = getValues();
          if (values.gender) remember('languages', values, values.gender);
          setPhase('languages');
        }}
        title={t('onboarding.about.intoTitle')}
        titleStyle={{ marginBottom: -8 }}
        headerAction={{ label: t('onboarding.skipShort'), onPress: () => void finishAbout() }}
        primaryLabel={
          interests.selectedIds.length
            ? t('onboarding.about.nextPicked', { count: interests.selectedIds.length })
            : t('onboarding.next')
        }
        onPrimary={() => void onIntoNext()}
        primaryLoading={interests.saving || saving}
        primaryDisabled={interests.loading || interests.failed}
        error={formError || phaseError || (interests.failed ? t('onboarding.genericError') : '')}>
        <InterestsFields
          activities={interests.activities}
          selectedIds={interests.selectedIds}
          onToggle={interests.toggle}
          loading={interests.loading}
        />
      </StepScaffold>
    );
  }

  if (inFlow && phase === 'languages') {
    return (
      <StepScaffold
        step="about"
        context={context}
        progressCurrent={4}
        onLeadingPress={() => {
          setPhaseError('');
          const values = getValues();
          if (values.gender) remember('details', values, values.gender);
          setPhase('details');
        }}
        title={t('onboarding.about.languages')}
        titleStyle={{ marginBottom: -18 }}
        primaryLabel={t('onboarding.next')}
        onPrimary={() => void onLanguagesNext()}
        primaryLoading={saving}
        error={formError || phaseError}>
        {languagesField}
      </StepScaffold>
    );
  }

  return (
    <StepScaffold
      step="about"
      context={context}
      title={t('onboarding.about.title')}
      primaryLabel={inFlow ? t('onboarding.next') : t('onboarding.save')}
      onPrimary={() => void onDetailsNext()}
      primaryLoading={savingGender || saving}
      error={formError || phaseError}>
      <MonoLabel>{t('onboarding.about.dateOfBirth')}</MonoLabel>
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field, fieldState }) => (
          <View style={{ marginTop: 10 }}>
            <DobField
              label={t('onboarding.about.dateOfBirth')}
              value={fromIsoDate(field.value)}
              onChange={(date) => field.onChange(toIsoDate(date))}
              maximumDate={yearsAgo(MINIMUM_AGE)}
              minimumDate={yearsAgo(MAXIMUM_AGE)}
              error={fieldState.error?.message}
            />
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 19, color: theme.colors.textSecondary, marginTop: 10 }}>
              {t('onboarding.about.dateOfBirthHint')}
            </Text>
          </View>
        )}
      />
      {genderField}
      {showGenderField}
    </StepScaffold>
  );
}
