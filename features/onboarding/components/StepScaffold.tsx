import { useCallback, type ReactNode } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, type TextStyle } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PROFILE_STEPS, isProfileStep, previousStep, type OnboardingStep } from '@crewup/shared';
import { PickerFieldVariantProvider } from '@/components/profile/pickerFieldShared';
import { Screen } from '@/components/ui';
import { hapticWarning } from '@/lib/haptics';
import { useAppMode } from '@/hooks/useAppMode';
import { useSession } from '@/hooks/useSession';
import { fontFamily, useTheme, useThemedStyles } from '@/theme';
import { Chevron, MonoLabel, PillCta, StepSubtitle, StepTitle, TextAction } from './kit';
import { OnboardingProgress } from './OnboardingProgress';
import { onboardingHref, type StepContext } from '../navigation';

/** Nine stops on the lime bar (onboarding.md §Screens). */
export const PROGRESS_TOTAL = PROFILE_STEPS.length + 2;

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
  /** Phone puts "Skip for now" above the CTA so it reads as a real choice. */
  secondaryPlacement?: 'above' | 'below';
  /** Small centred line above the CTA (e.g. "Photo is optional"). */
  footerNote?: string;
  /** Text action at the right of the top bar (Skip). */
  headerAction?: { label: string; onPress: () => void };
  /** Mono label in place of the progress bar, e.g. BETA ENDED · APP IS OPEN. */
  headerLabel?: string;
  error?: string;
  /** Endings with no way back (beta holding). */
  hideBack?: boolean;
  /** No leading control. Hardware back still confirms sign-out. */
  hideLeading?: boolean;
  /** 1-based fill for the profile bar. Defaults to this step after the display-name split. */
  progressCurrent?: number;
  /** Replaces Back / Log Out. Used to return between sub-screens of one server step. */
  onLeadingPress?: () => void;
};

/** Confirms leaving sign-up, then signs out. */
export function useConfirmSignOut() {
  const { t } = useTranslation();
  const { signOut } = useSession();
  return useCallback(() => {
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
}

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
  secondaryPlacement = 'below',
  footerNote,
  headerAction,
  headerLabel,
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
  const confirmSignOut = useConfirmSignOut();
  const inFlow = context !== 'edit';
  const styles = useThemedStyles((th) => ({
    topBar: {
      paddingTop: insets.top + 6,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: insets.top + 46,
    },
    side: { minWidth: 40, minHeight: 40, justifyContent: 'center' },
    backCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: th.colors.field,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingHorizontal: 24,
      paddingTop: context === 'flow' ? 28 : th.spacing.lg,
      paddingBottom: th.spacing.xxl,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: th.colors.fill,
      borderRadius: 14,
      paddingVertical: 11,
      paddingHorizontal: 14,
      marginTop: 12,
    },
    bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: th.colors.onFill },
    bannerText: { flex: 1, fontFamily: fontFamily.interMedium, fontSize: 13, lineHeight: 18, color: th.colors.onFill },
    body: { marginTop: 28 },
    error: {
      fontFamily: fontFamily.interRegular,
      fontSize: 13,
      lineHeight: 18,
      color: th.colors.statusOnDuty,
      marginTop: th.spacing.md,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: th.spacing.md,
      paddingBottom: Math.max(insets.bottom, th.spacing.lg),
      backgroundColor: th.colors.bgCanvas,
      gap: 14,
    },
    note: {
      fontFamily: fontFamily.interRegular,
      fontSize: 12.5,
      color: th.colors.textTertiary,
      textAlign: 'center',
    },
  }));

  const previous = step && mode && context === 'flow' ? previousStep(mode, step) : null;
  const showLogout = context === 'flow' && step === 'name_handle' && !onLeadingPress;

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
  const progressNow =
    progressCurrent ??
    (stepIndex >= 5 ? stepIndex + 3 : stepIndex >= 2 ? stepIndex + 4 : stepIndex >= 0 ? stepIndex + 2 : -1);
  const showProgress = progressNow > 0 && context === 'flow';

  const secondary =
    secondaryLabel && onSecondary ? (
      <View style={{ alignItems: 'center' }}>
        <TextAction label={secondaryLabel} onPress={onSecondary} />
      </View>
    ) : null;

  return (
    <Screen style={{ padding: 0 }}>
      {inFlow ? (
        <View style={styles.topBar}>
          <View style={styles.side}>
            {hideBack || hideLeading ? null : showLogout ? (
              <TextAction label={t('onboarding.logOut')} onPress={goBack} />
            ) : (
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.back')}
                hitSlop={6}
                style={({ pressed }) => [styles.backCircle, { opacity: pressed ? 0.7 : 1 }]}>
                <Chevron direction="left" size={16} color={theme.colors.textPrimary} />
              </Pressable>
            )}
          </View>
          <View style={{ flex: 1, alignItems: headerLabel ? 'center' : undefined }}>
            {headerLabel ? (
              <MonoLabel style={{ fontSize: 10.5, color: theme.colors.accentText }}>{headerLabel}</MonoLabel>
            ) : showProgress ? (
              <OnboardingProgress
                current={progressNow}
                total={PROGRESS_TOTAL}
                label={t('onboarding.stepOf', { current: progressNow, total: PROGRESS_TOTAL })}
              />
            ) : null}
          </View>
          <View style={[styles.side, { alignItems: 'flex-end' }]}>
            {headerAction ? <TextAction label={headerAction.label} onPress={headerAction.onPress} /> : null}
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {title ? <StepTitle style={titleStyle}>{title}</StepTitle> : null}
          {subtitle ? <StepSubtitle>{subtitle}</StepSubtitle> : null}
          {banner ? (
            <View style={styles.banner} accessibilityLiveRegion="polite">
              <View style={styles.bannerDot} />
              <Text style={styles.bannerText}>{banner}</Text>
            </View>
          ) : null}
          <PickerFieldVariantProvider value="filled">
            <View style={title || subtitle ? [styles.body, banner ? { marginTop: 12 } : null] : null}>{children}</View>
          </PickerFieldVariantProvider>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          {footerNote ? <Text style={styles.note}>{footerNote}</Text> : null}
          {secondaryPlacement === 'above' ? secondary : null}
          <PillCta label={primaryLabel} onPress={onPrimary} loading={primaryLoading} disabled={primaryDisabled} />
          {secondaryPlacement === 'below' ? secondary : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
