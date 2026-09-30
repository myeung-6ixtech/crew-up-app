import { useCallback, type ReactNode } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type TextStyle } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PROFILE_STEPS, isProfileStep, previousStep, type OnboardingStep } from '@crewup/shared';
import { AppIcon, BodyText, Button, Screen, Subtitle, Title } from '@/components/ui';
import { hapticWarning } from '@/lib/haptics';
import { useAppMode } from '@/hooks/useAppMode';
import { useSession } from '@/hooks/useSession';
import { useTheme, useThemedStyles } from '@/theme';
import { OnboardingProgress } from './OnboardingProgress';
import { onboardingHref, type StepContext } from '../navigation';

type StepScaffoldProps = {
  step?: OnboardingStep;
  context: StepContext;
  title?: string;
  titleStyle?: TextStyle;
  subtitle?: string;
  banner?: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  error?: string;
  /** Endings with no way back (beta holding). */
  hideBack?: boolean;
  /** House rules: no Log Out control. Hardware back still confirms sign-out. */
  hideLeading?: boolean;
  /** 1-based fill for the profile bar. Defaults to this step after the display-name split. */
  progressCurrent?: number;
  /** Replaces Back / Log Out. Used to return from display name to the name form. */
  onLeadingPress?: () => void;
};

export function StepScaffold({
  step,
  context,
  title,
  titleStyle,
  subtitle,
  banner,
  children,
  primaryLabel,
  onPrimary,
  primaryLoading,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  error,
  hideBack,
  hideLeading,
  progressCurrent,
  onLeadingPress,
}: StepScaffoldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppMode();
  const { signOut } = useSession();
  const inFlow = context !== 'edit';
  const styles = useThemedStyles((th) => ({
    topBar: {
      paddingTop: inFlow ? insets.top + th.spacing.sm : 0,
      paddingHorizontal: th.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: inFlow ? insets.top + 48 : 0,
    },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: th.spacing.xs },
    scroll: {
      padding: th.spacing.lg,
      paddingTop: context === 'flow' ? 40 : th.spacing.lg,
      paddingBottom: th.spacing.xxxl + 120,
    },
    banner: {
      backgroundColor: th.colors.accentSubtle,
      borderRadius: th.radius.input,
      padding: th.spacing.md,
      marginBottom: th.spacing.lg,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: th.spacing.lg,
      paddingTop: th.spacing.md,
      paddingBottom: Math.max(insets.bottom, th.spacing.lg),
      backgroundColor: th.colors.bgCanvas,
      borderTopWidth: 1,
      borderTopColor: th.colors.hairline,
      gap: th.spacing.xs,
    },
  }));

  const previous = step && mode && context === 'flow' ? previousStep(mode, step) : null;
  const showLogout = context === 'flow' && step === 'name_handle' && !onLeadingPress;

  const confirmSignOut = useCallback(() => {
    Alert.alert(t('onboarding.signOutConfirmTitle'), t('onboarding.signOutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('onboarding.logOut'),
        style: 'destructive',
        onPress: () => {
          hapticWarning();
          void signOut();
        },
      },
    ]);
  }, [signOut, t]);

  const goBack = useCallback(() => {
    if (onLeadingPress) {
      onLeadingPress();
      return;
    }
    if (showLogout || (context === 'flow' && !step)) {
      confirmSignOut();
      return;
    }
    if (router.canGoBack()) router.back();
    else if (previous) router.replace(onboardingHref(previous));
  }, [confirmSignOut, context, onLeadingPress, previous, router, showLogout, step]);

  useFocusEffect(
    useCallback(() => {
      if (!inFlow || hideBack) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBack();
        return true;
      });
      return () => subscription.remove();
    }, [goBack, hideBack, inFlow]),
  );

  const stepIndex = step && isProfileStep(step) ? PROFILE_STEPS.indexOf(step) : -1;
  // Display name, languages, and activities are extra screens. Photo is collected with display name, so it has no bar slot.
  const progressTotal = PROFILE_STEPS.length + 2;
  const progressNow =
    progressCurrent ??
    (stepIndex >= 5 ? stepIndex + 3 : stepIndex >= 2 ? stepIndex + 4 : stepIndex >= 0 ? stepIndex + 2 : -1);

  return (
    <Screen style={{ padding: 0 }}>
      {inFlow ? (
        <View>
          <View style={styles.topBar}>
            {hideBack || hideLeading ? (
              <View />
            ) : (
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel={showLogout ? t('onboarding.logOut') : t('onboarding.back')}
                style={styles.backButton}>
                {showLogout ? null : <AppIcon name="chevronLeft" size={22} color={theme.colors.accentText} />}
                <BodyText style={{ color: theme.colors.accentText }}>
                  {showLogout ? t('onboarding.logOut') : t('onboarding.back')}
                </BodyText>
              </Pressable>
            )}
          </View>
          {progressNow > 0 && context === 'flow' ? (
            <OnboardingProgress
              current={progressNow}
              total={progressTotal}
              label={t('onboarding.stepOf', { current: progressNow, total: progressTotal })}
            />
          ) : null}
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {banner ? (
            <View style={styles.banner}>
              <BodyText>{banner}</BodyText>
            </View>
          ) : null}
          {title ? <Title style={{ marginBottom: 20, ...titleStyle }}>{title}</Title> : null}
          {subtitle ? <Subtitle style={{ marginBottom: theme.spacing.lg }}>{subtitle}</Subtitle> : null}
          {children}
          {error ? (
            <BodyText style={{ color: theme.colors.statusOnDuty, marginTop: theme.spacing.md }}>{error}</BodyText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={primaryLabel}
            onPress={onPrimary}
            loading={primaryLoading}
            disabled={primaryDisabled}
            noTopMargin
          />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" noTopMargin />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
