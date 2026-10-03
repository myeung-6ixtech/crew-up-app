import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FULL_NAME_PATTERN, NameHandlePatchSchema, UsernameSchema } from '@crewup/shared';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useAuth, useSession } from '@/hooks/useSession';
import { fontFamily, useTheme } from '@/theme';
import { FilledField, MonoTag, RadioPill } from '../components/kit';
import { PhotoCircle } from '../components/PhotoCircle';
import { useAvatarPicker } from '../components/PhotoSourceSheet';
import { StepScaffold } from '../components/StepScaffold';
import { UsernameField, type UsernameStatus } from '../components/UsernameField';
import {
  DISPLAY_NAME_STYLES,
  displayNameOptions,
  displayNameSample,
  displayStyleFromSaved,
  splitFullName,
  type DisplayNameStyle,
} from '../displayName';
import { useStepNavigation, useStepSave } from '../hooks/useStepForm';
import type { StepContext } from '../navigation';
import { OnboardingRequestError, savePreferredName, saveStep } from '../services/onboardingService';

const NamePartSchema = z
  .string()
  .trim()
  .min(1, 'Enter your name')
  .max(50)
  .regex(FULL_NAME_PATTERN, 'Use letters, spaces, hyphens, apostrophes or dots only');

const NameFormSchema = z.object({
  username: UsernameSchema,
  firstName: NamePartSchema,
  lastName: NamePartSchema,
  displayStyle: z.enum(DISPLAY_NAME_STYLES),
  fullNameNative: z.string().trim().max(100).optional(),
});

type NameForm = z.infer<typeof NameFormSchema>;

const STYLE_LABELS: Record<DisplayNameStyle, string> = {
  full: 'onboarding.nameHandle.displayFull',
  initial: 'onboarding.nameHandle.displayInitial',
  last: 'onboarding.nameHandle.displayLast',
  native: 'onboarding.nameHandle.displayNative',
  fullNative: 'onboarding.nameHandle.displayFullNative',
};

export function NameHandleStep({ context }: { context: StepContext }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { profile } = useAuth();
  const { refreshProfile } = useSession();
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [phase, setPhase] = useState<'details' | 'display'>(() =>
    context === 'flow' && profile?.username && profile?.full_name && !profile?.preferred_name ? 'display' : 'details',
  );
  const [detailsError, setDetailsError] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const photo = useAvatarPicker(profile?.avatar_file_id ?? null);
  const avatarFileId = photo.fileId;
  const { save, saving, formError } = useStepSave('name_handle', context);
  const navigate = useStepNavigation('name_handle', context);
  const saved = splitFullName(profile?.full_name ?? '');
  const form = useForm<NameForm>({
    resolver: zodResolver(NameFormSchema),
    defaultValues: {
      username: profile?.username ?? '',
      firstName: saved.firstName,
      lastName: saved.lastName,
      displayStyle: displayStyleFromSaved(
        saved.firstName,
        saved.lastName,
        profile?.preferred_name,
        profile?.full_name_native,
      ),
      fullNameNative: profile?.full_name_native ?? '',
    },
    mode: 'onTouched',
  });
  const { control, watch, handleSubmit, setError } = form;
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const otherName = watch('fullNameNative');
  const displayStyle = watch('displayStyle');
  const inFlow = context === 'flow';
  const showDisplay = inFlow && phase === 'display';

  const samples = useMemo(
    () => ({
      full: displayNameSample(firstName ?? '', lastName ?? '', 'full', otherName),
      initial: displayNameSample(firstName ?? '', lastName ?? '', 'initial', otherName),
      last: displayNameSample(firstName ?? '', lastName ?? '', 'last', otherName),
      native: displayNameSample(firstName ?? '', lastName ?? '', 'native', otherName),
      fullNative: displayNameSample(firstName ?? '', lastName ?? '', 'fullNative', otherName),
    }),
    [firstName, lastName, otherName],
  );
  const options = useMemo(
    () => displayNameOptions(firstName ?? '', lastName ?? '', otherName),
    [firstName, lastName, otherName],
  );

  const detailsPayload = (values: NameForm) => {
    const fullName = displayNameSample(values.firstName, values.lastName, 'full');
    return NameHandlePatchSchema.safeParse({
      fullName,
      fullNameNative: values.fullNameNative || null,
      username: values.username,
    });
  };

  const applyFieldError = (field: string, message: string) => {
    if (field === 'username') setError('username', { message });
    else setError('firstName', { message });
  };

  const onDetailsNext = handleSubmit(async (values) => {
    const parsed = detailsPayload(values);
    if (!parsed.success) {
      hapticError();
      setError('firstName', { message: parsed.error.issues[0]?.message ?? t('onboarding.genericError') });
      return;
    }
    if (!inFlow) {
      await save(parsed.data, applyFieldError);
      return;
    }
    setSavingDetails(true);
    setDetailsError('');
    try {
      await saveStep('name_handle', parsed.data, { advance: false });
      await refreshProfile();
      hapticSuccess();
      setPhase('display');
    } catch (error) {
      hapticError();
      if (error instanceof OnboardingRequestError) {
        const fields = Object.entries(error.fields);
        fields.forEach(([field, message]) => applyFieldError(field, message));
        if (!fields.length) setDetailsError(error.message);
      } else {
        setDetailsError(t('onboarding.genericError'));
      }
    } finally {
      setSavingDetails(false);
    }
  });

  const onDisplayNext = handleSubmit(async (values) => {
    const preferredName = displayNameSample(values.firstName, values.lastName, values.displayStyle);
    if (!preferredName) {
      hapticError();
      setDetailsError(t('onboarding.genericError'));
      return;
    }
    if (avatarFileId && avatarFileId !== (profile?.avatar_file_id ?? null)) {
      try {
        await saveStep('photo', { avatarFileId }, { advance: false });
      } catch (error) {
        hapticError();
        setDetailsError(error instanceof OnboardingRequestError ? error.message : t('onboarding.genericError'));
        return;
      }
    }
    setSavingDetails(true);
    setDetailsError('');
    try {
      await savePreferredName(
        preferredName,
        {
          full_name: displayNameSample(values.firstName, values.lastName, 'full'),
          full_name_native: values.fullNameNative || null,
          username: values.username,
        },
        { advance: inFlow },
      );
      await refreshProfile();
      hapticSuccess();
      navigate();
    } catch (error) {
      hapticError();
      setDetailsError(error instanceof OnboardingRequestError ? error.message : t('onboarding.genericError'));
    } finally {
      setSavingDetails(false);
    }
  });

  if (showDisplay) {
    return (
      <StepScaffold
        step="name_handle"
        context={context}
        progressCurrent={2}
        onLeadingPress={() => {
          setDetailsError('');
          setPhase('details');
        }}
        title={t('onboarding.nameHandle.displayPrompt')}
        primaryLabel={t('onboarding.next')}
        onPrimary={onDisplayNext}
        primaryLoading={saving || savingDetails}
        primaryDisabled={photo.uploading}
        footerNote={
          photo.uploading
            ? t('onboarding.photo.uploading')
            : photo.hasPhoto
              ? t('onboarding.photo.savedHint')
              : t('onboarding.photo.optionalHint')
        }
        error={formError || detailsError || photo.error}>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={photo.hasPhoto ? t('onboarding.photo.change') : t('onboarding.photo.choose')}
            disabled={photo.uploading}
            onPress={photo.open}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <PhotoCircle
              size={148}
              tone="picker"
              name={samples.full}
              fileId={photo.previewUri ? null : photo.fileId}
              localUri={photo.previewUri}
              uploading={photo.uploading}
              uploadingLabel={t('onboarding.photo.uploadingTag')}
            />
          </Pressable>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fontFamily.jakartaBold,
              fontSize: 24,
              letterSpacing: -0.5,
              color: theme.colors.textPrimary,
            }}>
            {samples[displayStyle]}
          </Text>
        </View>
        {photo.sheet}
        <Controller
          control={control}
          name="displayStyle"
          render={({ field }) => (
            <View style={{ gap: 8, marginTop: 24 }}>
              {options.map((style) => (
                <RadioPill
                  key={style}
                  label={samples[style]}
                  accessibilityLabel={t(STYLE_LABELS[style])}
                  selected={field.value === style}
                  onPress={() => field.onChange(style)}
                />
              ))}
            </View>
          )}
        />
      </StepScaffold>
    );
  }

  return (
    <StepScaffold
      step="name_handle"
      context={context}
      progressCurrent={inFlow ? 1 : undefined}
      title={inFlow ? t('onboarding.nameHandle.title') : t('onboarding.review.sections.nameHandle')}
      subtitle={inFlow ? t('onboarding.nameHandle.subtitle') : undefined}
      primaryLabel={inFlow ? t('onboarding.next') : t('onboarding.save')}
      onPrimary={onDetailsNext}
      primaryLoading={savingDetails || saving}
      primaryDisabled={usernameStatus === 'unavailable' || usernameStatus === 'checking'}
      error={formError || detailsError}>
      <Controller
        control={control}
        name="username"
        render={({ field, fieldState }) => (
          <UsernameField
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            onStatusChange={setUsernameStatus}
          />
        )}
      />
      <Controller
        control={control}
        name="firstName"
        render={({ field, fieldState }) => (
          <FilledField
            label={t('onboarding.nameHandle.firstName')}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('onboarding.nameHandle.firstNamePlaceholder')}
            autoComplete="given-name"
            textContentType="givenName"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field, fieldState }) => (
          <FilledField
            label={t('onboarding.nameHandle.lastName')}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('onboarding.nameHandle.lastNamePlaceholder')}
            autoComplete="family-name"
            textContentType="familyName"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="fullNameNative"
        render={({ field, fieldState }) => (
          <FilledField
            label={t('onboarding.nameHandle.fullNameNative')}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('onboarding.nameHandle.fullNameNativePlaceholder')}
            error={fieldState.error?.message}
            trailing={<MonoTag label={t('onboarding.optionalTag')} />}
          />
        )}
      />
    </StepScaffold>
  );
}
