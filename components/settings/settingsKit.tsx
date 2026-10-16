import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackGlyph } from '@/components/crew/kit';
import { Screen } from '@/components/ui';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

/**
 * Settings pages opened from the menu — design/…/CrewUp - Add Trip Flow.dc.html, 3D Language, 3E Privacy,
 * 3F Account Security. Round back button, a 28px title and one-line intro, white cards of rows.
 */

const LINE = { light: '#EEF0EA', dark: '#262C30' } as const;

export function SettingsPage({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <Screen style={{ padding: 0 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: 32, gap: 22 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? theme.colors.field : theme.colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            })}>
            <BackGlyph color={theme.colors.textPrimary} />
          </Pressable>
          <View style={{ gap: 6 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 28, letterSpacing: -0.6, color: theme.colors.textPrimary }}>
              {title}
            </Text>
            {subtitle ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>{subtitle}</Text> : null}
          </View>
          {children}
        </ScrollView>
        {footer ? <View style={{ paddingTop: 12, paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 14) + 6, gap: 10 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function SettingsSection({ label, children }: { label?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {label ? (
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 1.2, color: theme.colors.textSecondary, paddingLeft: 4 }}>{label.toUpperCase()}</Text>
      ) : null}
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

/** Ink ring; selected fills lime with an ink dot. */
export function RadioMark({ selected, dim }: { selected: boolean; dim?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: selected ? theme.colors.ink : dim ? theme.colors.track : '#C9CEC1',
        backgroundColor: selected ? '#A8E05F' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0E1113' }} /> : null}
    </View>
  );
}

/** One choice in a settings card. `last` drops the divider; `trailing` replaces the radio (e.g. a SOON tag). */
export function RadioRow({
  label,
  detail,
  selected,
  onPress,
  disabled,
  dim,
  last,
  trailing,
  minHeight = 58,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /** Greyed label (e.g. an audience while Hidden is picked) that can still be tapped. */
  dim?: boolean;
  last?: boolean;
  trailing?: ReactNode;
  minHeight?: number;
}) {
  const theme = useTheme();
  const muted = disabled || dim;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        if (selected) return;
        hapticSelection();
        onPress?.();
      }}
      style={({ pressed }) => ({
        minHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: pressed && !disabled ? theme.colors.ground : 'transparent',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: LINE[theme.mode === 'dark' ? 'dark' : 'light'],
      })}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: selected ? fontFamily.interMedium : fontFamily.interRegular,
            fontSize: 15,
            color: muted ? theme.colors.textTertiary : theme.colors.textPrimary,
          }}>
          {label}
        </Text>
        {detail ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>{detail}</Text> : null}
      </View>
      {trailing ?? <RadioMark selected={selected} dim={muted} />}
    </Pressable>
  );
}

export function SettingsHint({ children }: { children: string }) {
  const theme = useTheme();
  return <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: theme.colors.textSecondary, paddingLeft: 4, marginTop: -14 }}>{children}</Text>;
}
