import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FULL_NAME_PATTERN, NameHandleSchema, UsernameSchema } from '@crewup/shared';
import { Avatar, BodyText, HeadlineText, Input, PillSelectorGroup } from '@/components/ui';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useAuth, useSession } from '@/hooks/useSession';
import { useTheme } from '@/theme';
import { StepScaffold } from '../components/StepScaffold';
import { UsernameField, type UsernameStatus } from '../components/UsernameField';
import {
  displayNameSample,
  displayStyleFromSaved,
  splitFullName,
  type DisplayNameStyle,
} from '../displayName';
import { useStepSave } from '../hooks/useStepForm';
import type { StepContext } from '../navigation';
import { pickAndUploadAvatar } from './PhotoStep';
import { OnboardingRequestError, saveStep } from '../services/onboardingService';

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
  displayStyle: z.enum(['full', 'initial', 'last']),
  fullNameNative: z.string().trim().max(100).optional(),
});

type NameForm = z.infer<typeof NameFormSchema>;

const STYLE_LABELS: Record<DisplayNameStyle, string> = {
  full: 'onboarding.nameHandle.displayFull',
  initial: 'onboarding.nameHandle.displayInitial',
  last: 'onboarding.nameHandle.displayLast',
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
  const [avatarFileId, setAvatarFileId] = useState<string | null>(profile?.avatar_file_id ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { save, saving, formError } = useStepSave('name_handle', context);
  const saved = splitFullName(profile?.full_name ?? '');
  const form = useForm<NameForm>({
    resolver: zodResolver(NameFormSchema),
    defaultValues: {
      username: profile?.username ?? '',
      firstName: saved.firstName,
      lastName: saved.lastName,
      displayStyle: displayStyleFromSaved(saved.firstName, saved.lastName, profile?.preferred_name),
      fullNameNative: profile?.full_name_native ?? '',
    },
    mode: 'onTouched',
  });
  const { control, watch, handleSubmit, setError } = form;
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const displayStyle = watch('displayStyle');
  const inFlow = context === 'flow';
  const showDisplay = inFlow && phase === 'display';

  const samples = useMemo(
    () => ({
      full: displayNameSample(firstName ?? '', lastName ?? '', 'full'),
      initial: displayNameSample(firstName ?? '', lastName ?? '', 'initial'),
      last: displayNameSample(firstName ?? '', lastName ?? '', 'last'),
    }),
    [firstName, lastName],
  );

  const payload = (values: NameForm, preferredName: string | null) => {
    const fullName = displayNameSample(values.firstName, values.lastName, 'full');
    return NameHandleSchema.safeParse({
      fullName,
      fullNameNative: values.fullNameNative || null,
      preferredName,
      username: values.username,
    });
  };

  const applyFieldError = (field: string, message: string) => {
    if (field === 'username') setError('username', { message });
    else setError('firstName', { message });
  };

  const onDetailsNext = handleSubmit(async (values) => {
    const parsed = payload(values, null);
    if (!parsed.success) {
      hapticError();
      setError('firstName', { message: parsed.error.issues[0]?.message ?? t('onboarding.genericError') });
      return;
    }
    if (!inFlow) {
      const withDisplay = payload(values, profile?.preferred_name ?? null);
      if (!withDisplay.success) {
        hapticError();
        setError('firstName', { message: withDisplay.error.issues[0]?.message ?? t('onboarding.genericError') });
        return;
      }
      await save(withDisplay.data, applyFieldError);
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

  const onPickAvatar = async () => {
    setDetailsError('');
    setUploadingAvatar(true);
    try {
      const result = await pickAndUploadAvatar();
      if (result.status === 'too_large') {
        hapticError();
        setDetailsError(t('onboarding.photo.tooLarge'));
      }
      if (result.status === 'uploaded') {
        hapticSuccess();
        setAvatarFileId(result.fileId);
        setAvatarPreview(result.uri);
      }
    } catch {
      hapticError();
      setDetailsError(t('onboarding.genericError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onDisplayNext = handleSubmit(async (values) => {
    const preferredName = displayNameSample(values.firstName, values.lastName, values.displayStyle);
    const parsed = payload(values, preferredName || null);
    if (!parsed.success) {
      hapticError();
      setDetailsError(parsed.error.issues[0]?.message ?? t('onboarding.genericError'));
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
    await save(parsed.data, applyFieldError);
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
        titleStyle={{ marginBottom: 20 }}
        primaryLabel={t('onboarding.next')}
        onPrimary={onDisplayNext}
        primaryLoading={saving}
        primaryDisabled={uploadingAvatar}
        error={formError || detailsError}>
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={avatarFileId ? t('onboarding.photo.change') : t('onboarding.photo.choose')}
            disabled={uploadingAvatar}
            onPress={() => void onPickAvatar()}>
            <Avatar
              name={samples[displayStyle] || undefined}
              fileId={avatarPreview ? null : avatarFileId}
              localUri={avatarPreview}
              size="xl"
            />
          </Pressable>
          <HeadlineText style={{ marginTop: theme.spacing.md, textAlign: 'center' }}>
            {samples[displayStyle]}
          </HeadlineText>
          <BodyText muted style={{ marginTop: theme.spacing.xs, textAlign: 'center' }}>
            {uploadingAvatar ? t('onboarding.photo.uploading') : t('home.editProfilePhotoHint')}
          </BodyText>
        </View>
        <Controller
          control={control}
          name="displayStyle"
          render={({ field }) => (
            <PillSelectorGroup
              tone="fill"
              value={field.value}
              onChange={field.onChange}
              options={(['full', 'initial', 'last'] as const).map((style) => ({
                value: style,
                label: samples[style],
                accessibilityLabel: t(STYLE_LABELS[style]),
              }))}
            />
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
          <Input
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
          <Input
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
          <Input
            label={t('onboarding.nameHandle.fullNameNative')}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('onboarding.nameHandle.fullNameNativePlaceholder')}
            error={fieldState.error?.message}
          />
        )}
      />
    </StepScaffold>
  );
}
