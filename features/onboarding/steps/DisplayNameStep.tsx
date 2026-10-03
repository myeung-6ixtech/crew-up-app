import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SCREENS } from '@/constants/screens';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useAuth, useSession } from '@/hooks/useSession';
import { fontFamily, useTheme } from '@/theme';
import { RadioPill } from '../components/kit';
import { StepScaffold } from '../components/StepScaffold';
import {
  displayNameOptions,
  displayNameSample,
  displayStyleFromSaved,
  splitFullName,
  type DisplayNameStyle,
} from '../displayName';
import { OnboardingRequestError, savePreferredName } from '../services/onboardingService';

const STYLE_LABELS: Record<DisplayNameStyle, string> = {
  full: 'onboarding.nameHandle.displayFull',
  initial: 'onboarding.nameHandle.displayInitial',
  last: 'onboarding.nameHandle.displayLast',
  native: 'onboarding.nameHandle.displayNative',
  fullNative: 'onboarding.nameHandle.displayFullNative',
};

/** Edit profile: choose the name other crew see, without changing the legal name. */
export function DisplayNameStep() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { refreshProfile } = useSession();
  const [saving, setSaving] = useState(false);
  const saved = splitFullName(profile?.full_name ?? '');
  const otherName = profile?.full_name_native ?? '';
  const [style, setStyle] = useState<DisplayNameStyle>(() =>
    displayStyleFromSaved(saved.firstName, saved.lastName, profile?.preferred_name, otherName),
  );
  const [error, setError] = useState('');
  const samples = useMemo(
    () => ({
      full: displayNameSample(saved.firstName, saved.lastName, 'full', otherName),
      initial: displayNameSample(saved.firstName, saved.lastName, 'initial', otherName),
      last: displayNameSample(saved.firstName, saved.lastName, 'last', otherName),
      native: displayNameSample(saved.firstName, saved.lastName, 'native', otherName),
      fullNative: displayNameSample(saved.firstName, saved.lastName, 'fullNative', otherName),
    }),
    [otherName, saved.firstName, saved.lastName],
  );
  const options = useMemo(
    () => displayNameOptions(saved.firstName, saved.lastName, otherName),
    [otherName, saved.firstName, saved.lastName],
  );

  const onSave = async () => {
    const preferredName = samples[style];
    if (!preferredName) {
      hapticError();
      setError(t('onboarding.genericError'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await savePreferredName(preferredName, profile, { advance: false });
      await refreshProfile();
      hapticSuccess();
      if (router.canGoBack()) router.back();
      else router.replace(SCREENS.profile.edit);
    } catch (saveError) {
      hapticError();
      const message =
        saveError instanceof OnboardingRequestError
          ? Object.values(saveError.fields)[0] || saveError.message
          : t('onboarding.genericError');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepScaffold
      context="edit"
      title={t('onboarding.nameHandle.displayPrompt')}
      primaryLabel={t('onboarding.save')}
      onPrimary={() => void onSave()}
      primaryLoading={saving}
      error={error}>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fontFamily.jakartaBold,
          fontSize: 24,
          letterSpacing: -0.5,
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginBottom: 24,
        }}>
        {samples[style]}
      </Text>
      <View style={{ gap: 8 }}>
        {options.map((option) => (
          <RadioPill
            key={option}
            label={samples[option] || t('onboarding.nameHandle.displayEmpty')}
            accessibilityLabel={t(STYLE_LABELS[option])}
            selected={style === option}
            onPress={() => setStyle(option)}
          />
        ))}
      </View>
    </StepScaffold>
  );
}
