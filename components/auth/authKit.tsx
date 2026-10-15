import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BackGlyph, CircleButton } from '@/components/crew/kit';
import { Screen } from '@/components/ui';
import { FilledField } from '@/features/onboarding/components/kit';
import { hapticImpact } from '@/lib/haptics';
import type { PasswordRule } from '@/lib/password';
import { fontFamily, useTheme } from '@/theme';

/**
 * Email sign up, verification and log in — design/…/CrewUp  - Authentication and Onboarding.dc.html (4A–4L).
 * Light ground, a round back button, filled fields, and full-width pills.
 */

export const ERROR_RED = '#B23A26';
const OLIVE = '#4F6E19';

export function AuthTopBar({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={{ paddingTop: 6, paddingHorizontal: 20 }}>
      <CircleButton accessibilityLabel={t('common.back')} onPress={onBack}>
        <BackGlyph color={theme.colors.textPrimary} />
      </CircleButton>
    </View>
  );
}

/** Back bar, a scrolling body, and a footer that rides above the keyboard. `centered` is for the icon notices. */
export function AuthPage({
  onBack,
  children,
  footer,
  centered,
}: {
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>{onBack ? <AuthTopBar onBack={onBack} /> : null}</View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={centered ? { flexGrow: 1 } : { flexGrow: 1, paddingTop: 28, paddingHorizontal: 24, paddingBottom: 16 }}>
          {children}
        </ScrollView>
        {footer ? <View style={{ paddingTop: 12, paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 14), gap: 10 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Mono status at the end of a field: AVAILABLE, TAKEN, MATCH, NO MATCH. */
export function FieldStatus({ label, tone }: { label: string; tone: 'ok' | 'bad' | 'muted' }) {
  const theme = useTheme();
  if (!label) return null;
  return (
    <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: tone === 'ok' ? OLIVE : tone === 'bad' ? ERROR_RED : theme.colors.textTertiary }}>
      {label}
    </Text>
  );
}

/** Password field with Show / Hide. `shown` and `onToggle` let a confirm field follow the same toggle. */
export function PasswordField({
  label,
  value,
  onChangeText,
  shown,
  onToggle,
  error,
  trailing,
  isNew,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  shown: boolean;
  onToggle?: () => void;
  error?: string;
  trailing?: ReactNode;
  /** New password: lets iOS offer a strong one and save it. */
  isNew?: boolean;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'style'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <FilledField
      {...rest}
      label={label}
      value={value}
      onChangeText={onChangeText}
      error={error}
      secureTextEntry={!shown}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={isNew ? 'newPassword' : 'password'}
      autoComplete={isNew ? 'new-password' : 'current-password'}
      trailing={
        trailing ??
        (onToggle ? (
          <Pressable accessibilityRole="button" onPress={onToggle} hitSlop={10} style={{ paddingVertical: 8, paddingLeft: 8 }}>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>
              {shown ? t('auth.hide') : t('auth.show')}
            </Text>
          </Pressable>
        ) : null)
      }
    />
  );
}

const STRENGTH = [
  { key: '', fg: '#6F7569', bar: '#DDE1D6' },
  { key: 'weak', fg: ERROR_RED, bar: '#D9826F' },
  { key: 'fair', fg: '#8A6A12', bar: '#E3B94F' },
  { key: 'good', fg: OLIVE, bar: '#C3E28F' },
  { key: 'strong', fg: OLIVE, bar: '#A8E05F' },
] as const;

function RuleTick({ ok }: { ok: boolean }) {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: ok ? '#A8E05F' : '#DDE1D6', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={9} height={7} viewBox="0 0 10 8">
        <Path d="M1 4l3 3 5-6" stroke={ok ? '#0E1113' : 'transparent'} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

/** Four-bar meter and the rules ticking live under a new password. */
export function PasswordChecklist({ rules, score, personalLabel }: { rules: PasswordRule[]; score: 0 | 1 | 2 | 3 | 4; personalLabel: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const level = STRENGTH[score];
  return (
    <View style={{ marginTop: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3, 4].map((bar) => (
            <View key={bar} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: bar <= score ? level.bar : '#DDE1D6' }} />
          ))}
        </View>
        <Text style={{ width: 56, textAlign: 'right', fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: level.fg }}>
          {level.key ? t(`auth.strength.${level.key}`).toUpperCase() : ''}
        </Text>
      </View>
      <View style={{ gap: 9, marginTop: 14, paddingLeft: 4 }}>
        {rules.map((rule) => (
          <View
            key={rule.key}
            accessibilityLabel={`${rule.key === 'personal' ? personalLabel : t(`auth.rules.${rule.key}`)}${rule.ok ? `, ${t('auth.ruleMet')}` : ''}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <RuleTick ok={rule.ok} />
            <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textPrimary }}>
              {rule.key === 'personal' ? personalLabel : t(`auth.rules.${rule.key}`)}
            </Text>
            {rule.meta ? <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: theme.colors.textTertiary }}>{rule.meta}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Outlined full-width pill (Resend email, I've verified, log in). */
export function OutlinePill({ label, onPress, disabled, loading }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      disabled={disabled || loading}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: pressed ? theme.colors.ink : '#D4D8CD',
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: disabled ? theme.colors.textTertiary : theme.colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

/** Bold text-only action under the pills (Back to log in). */
export function QuietAction({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: theme.colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

/** "Already have an account? Log in" — muted lead-in, bold link. */
export function InlineLink({ lead, label, onPress, center }: { lead?: string; label: string; onPress: () => void; center?: boolean }) {
  const theme = useTheme();
  return (
    <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary, textAlign: center ? 'center' : 'auto' }}>
      {lead ? `${lead} ` : ''}
      <Text accessibilityRole="link" onPress={onPress} style={{ fontFamily: fontFamily.interMedium, color: theme.colors.textPrimary }}>
        {label}
      </Text>
    </Text>
  );
}

export function OrDivider() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.track }} />
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>{t('auth.or')}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.track }} />
    </View>
  );
}

/** Centred 96px circle, title and body: Check your inbox, You're verified, This link has expired. */
export function CenterNotice({ icon, tone, title, children }: { icon: ReactNode; tone: 'lime' | 'field'; title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: tone === 'lime' ? theme.colors.fill : theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 27, lineHeight: 30, letterSpacing: -0.7, color: theme.colors.textPrimary, textAlign: 'center' }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function MailGlyph({ size = 40, color = '#0E1113' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2.5} stroke={color} strokeWidth={1.8} />
      <Path d="M3.5 6.5l8.5 6.5 8.5-6.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BigCheckGlyph() {
  return (
    <Svg width={40} height={32} viewBox="0 0 20 16">
      <Path d="M2 8.5l5.5 5.5L18 2" stroke="#0E1113" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ClockGlyph() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke="#0E1113" strokeWidth={1.8} />
      <Path d="M12 7.5V12l3 2" stroke="#0E1113" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** Opens the mail app's inbox: Mail on iOS, the default email app on Android. Falls back to a blank compose. */
export async function openMailApp() {
  try {
    if (Platform.OS === 'android') {
      const IntentLauncher = await import('expo-intent-launcher');
      await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
        category: 'android.intent.category.APP_EMAIL',
        flags: 268435456, // FLAG_ACTIVITY_NEW_TASK
      });
      return;
    }
    await Linking.openURL('message://');
  } catch {
    await Linking.openURL('mailto:').catch(() => undefined);
  }
}

/** Keeps the auth screens' show/hide state for a password and its confirm field together. */
export function useShowPassword() {
  const [shown, setShown] = useState(false);
  return { shown, toggle: () => setShown((value) => !value) };
}
