import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
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
import { AppIcon, BodyText, DatePickerField, PillSelectorGroup } from '@/components/ui';
import { UPDATE_PROFILE } from '@/graphql/mutations/profile';
import { useAuth, useSession } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { useTheme } from '@/theme';
import { getAboutDraft, setAboutDraft, type AboutDraft, type Gender } from '../aboutDraft';
import { StepScaffold } from '../components/StepScaffold';
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
  const [phase, setPhase] = useState<'details' | 'languages'>(() =>
    inFlow && remembered?.screen === 'languages' ? 'languages' : 'details',
  );
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
      setPhaseError(t('onboarding.genericError'));
    } finally {
      setSavingGender(false);
    }
  };

  const saveLanguages = async (gender: Gender, values: AboutForm) => {
    const languages = LanguagesSchema.safeParse({ languages: values.languages });
    if (!languages.success) {
      setError('languages', { message: languages.error.issues[0]?.message ?? t('onboarding.genericError') });
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
    setPhaseError('');
    await saveLanguages(gender, values);
  };

  const genderField = (
    <Controller
      control={control}
      name="gender"
      render={({ field, fieldState }) => (
        <>
          <PillSelectorGroup
            label={t('onboarding.about.gender')}
            tone="fill"
            value={field.value || undefined}
            onChange={field.onChange}
            options={GENDERS.map((gender) => ({
              value: gender,
              label: t(GENDER_LABELS[gender]),
            }))}
          />
          {fieldState.error?.message ? (
            <BodyText style={{ color: theme.colors.statusOnDuty, marginTop: -theme.spacing.sm }}>
              {fieldState.error.message}
            </BodyText>
          ) : null}
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
          accessibilityRole="checkbox"
          accessibilityState={{ checked: field.value }}
          onPress={() => field.onChange(!field.value)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
          }}>
          <AppIcon
            name={field.value ? 'checkboxOn' : 'checkboxOff'}
            size={22}
            color={field.value ? theme.colors.accentText : theme.colors.textTertiary}
          />
          <BodyText>{t('onboarding.about.showGender')}</BodyText>
        </Pressable>
      )}
    />
  );

  const languagesField = (
    <Controller
      control={control}
      name="languages"
      render={({ field, fieldState }) => (
        <>
          <PillSelectorGroup
            label={inFlow ? undefined : t('onboarding.about.languages')}
            tone="fill"
            multiple
            values={field.value ?? []}
            onToggle={(code) => {
              const current = field.value ?? [];
              field.onChange(
                current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
              );
            }}
            options={LANGUAGES.map(([code, name, native]) => ({
              value: code,
              label: name,
              accessibilityLabel: native === name ? name : `${name}, ${native}`,
            }))}
          />
          {fieldState.error?.message ? (
            <BodyText style={{ color: theme.colors.statusOnDuty, marginTop: -theme.spacing.sm }}>
              {fieldState.error.message}
            </BodyText>
          ) : null}
        </>
      )}
    />
  );

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
      subtitle={t('onboarding.about.subtitle')}
      primaryLabel={inFlow ? t('onboarding.next') : t('onboarding.save')}
      onPrimary={() => void onDetailsNext()}
      primaryLoading={savingGender || saving}
      error={formError || phaseError}>
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field, fieldState }) => (
          <DatePickerField
            label={t('onboarding.about.dateOfBirth')}
            value={fromIsoDate(field.value)}
            onChange={(date) => field.onChange(toIsoDate(date))}
            placeholder={t('onboarding.about.dateOfBirthPlaceholder')}
            maximumDate={yearsAgo(MINIMUM_AGE)}
            minimumDate={yearsAgo(MAXIMUM_AGE)}
            error={fieldState.error?.message}
          />
        )}
      />
      {genderField}
      {showGenderField}
      {inFlow ? null : languagesField}
    </StepScaffold>
  );
}
