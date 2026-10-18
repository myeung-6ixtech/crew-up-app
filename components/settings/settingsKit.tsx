import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

/**
 * Settings & Privacy pages — design/…/CrewUp Menu Prototype.dc.html (6C–6G), shown on the Add Trip Flow canvas.
 * A centred title in the top bar, then flat full-width rows on the page ground: mono group labels, an icon,
 * a title and a one-line sub, a value and a chevron. Pick lists use a 24px lime radio.
 */

const GUTTER = 24;

/** Stroke icons from the prototype (24×24, 1.8 stroke). */
export const SETTINGS_ICONS = {
  profile: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20.5c.8-3.7 3.9-6 7.5-6s6.7 2.3 7.5 6',
  guidelines: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.5a3.5 3.5 0 010 6.5M18 14.5c2 .6 3.2 2.4 3.5 5',
  safety: 'M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6zM9 12l2 2 4-4',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  account: 'M4 5h16v14H4zM9 11a2 2 0 100-4 2 2 0 000 4zM5.5 16c.5-2 2-3 3.5-3s3 1 3.5 3M14 9h4M14 13h3',
  appearance: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 3v18M12 7.5h4.5M12 12h6M12 16.5h4.5',
  language: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z',
  privacy: 'M6 10.5h12v10H6zM8.5 10.5V7.5a3.5 3.5 0 017 0v3M12 14.5v2',
  policy: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  terms: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h4',
  about: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.5',
} as const;

export type SettingsIcon = keyof typeof SETTINGS_ICONS;

export function SettingsGlyph({ name, color, size = 22 }: { name: SettingsIcon; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={SETTINGS_ICONS[name]} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Pressed-row tint, matching the prototype's hover. */
export function useRowTint() {
  const theme = useTheme();
  return theme.mode === 'dark' ? '#1A1F22' : '#EEF0EA';
}

export function BackChevron({ color }: { color: string }) {
  return (
    <Svg width={11} height={18} viewBox="0 0 10 16">
      <Path d="M8 2L2 8l6 6" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 44px back button, centred title, and a matching spacer. */
export function SettingsTopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const tint = useRowTint();
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={onBack ?? (() => router.back())}
        style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? tint : 'transparent' })}>
        <BackChevron color={theme.colors.textPrimary} />
      </Pressable>
      <Text accessibilityRole="header" numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>
        {title}
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

export function SettingsPage({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas, paddingTop: insets.top }}>
      <SettingsTopBar title={title} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 6, paddingHorizontal: GUTTER, paddingBottom: 40, gap: 22 }}>
          {subtitle ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 21, color: theme.colors.textSecondary }}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
        {footer ? <View style={{ paddingTop: 12, paddingHorizontal: GUTTER, paddingBottom: Math.max(insets.bottom, 14) + 6, gap: 10 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </View>
  );
}

export function SettingsLabel({ children, sub }: { children: string; sub?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 2, paddingBottom: 2 }}>
      <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 1.2, color: theme.colors.textSecondary }}>{children.toUpperCase()}</Text>
      {sub ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{sub}</Text> : null}
    </View>
  );
}

/** A labelled group of flat rows. Rows bleed to the screen edges so the pressed tint is full width. */
export function SettingsSection({ label, sub, children }: { label?: string; sub?: string; children: ReactNode }) {
  return (
    <View>
      {label ? <SettingsLabel sub={sub}>{label}</SettingsLabel> : null}
      <View style={{ marginHorizontal: -GUTTER }}>{children}</View>
    </View>
  );
}

function Chevron() {
  const theme = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M9 5l7 7-7 7" stroke={theme.colors.textTertiary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExternalMark() {
  const theme = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" stroke={theme.colors.textTertiary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Icon, title and sub, an optional value, then a chevron (pushes), an external mark (leaves the app) or nothing. */
export function SettingsRow({
  icon,
  label,
  sub,
  value,
  onPress,
  trail = onPress ? 'chevron' : 'none',
  minHeight = 64,
}: {
  icon?: SettingsIcon;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  trail?: 'chevron' | 'external' | 'none';
  minHeight?: number;
}) {
  const theme = useTheme();
  const tint = useRowTint();
  return (
    <Pressable
      accessibilityRole={onPress ? (trail === 'external' ? 'link' : 'button') : 'text'}
      accessibilityLabel={[label, value, sub].filter(Boolean).join(', ')}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: GUTTER,
        paddingVertical: 10,
        backgroundColor: pressed ? tint : 'transparent',
      })}>
      {icon ? <SettingsGlyph name={icon} color={theme.colors.textPrimary} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15.5, color: theme.colors.textPrimary }}>{label}</Text>
        {sub ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{sub}</Text> : null}
      </View>
      {value ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary }}>{value}</Text> : null}
      {trail === 'chevron' ? <Chevron /> : trail === 'external' ? <ExternalMark /> : null}
    </Pressable>
  );
}

/** 24px radio: lime with an ink dot when on, a quiet ring when off. */
export function RadioMark({ selected, dim }: { selected: boolean; dim?: boolean }) {
  const theme = useTheme();
  if (selected) {
    return (
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#A8E05F', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#0E1113' }} />
      </View>
    );
  }
  return <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: dim ? theme.colors.track : theme.colors.textTertiary }} />;
}

/** One choice in a pick list. `trailing` replaces the radio (e.g. a SOON tag or a spinner). */
export function RadioRow({
  label,
  detail,
  selected,
  onPress,
  disabled,
  dim,
  trailing,
  minHeight = 62,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /** Greyed (e.g. an audience while Hidden is picked) but still tappable. */
  dim?: boolean;
  /** Kept for callers from the card layout; flat rows have no dividers. */
  last?: boolean;
  trailing?: ReactNode;
  minHeight?: number;
}) {
  const theme = useTheme();
  const tint = useRowTint();
  const muted = disabled || dim;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      accessibilityLabel={[label, detail].filter(Boolean).join(', ')}
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
        paddingHorizontal: GUTTER,
        paddingVertical: 10,
        backgroundColor: pressed && !disabled ? tint : 'transparent',
      })}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15.5, color: muted ? theme.colors.textTertiary : theme.colors.textPrimary }}>{label}</Text>
        {detail ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{detail}</Text> : null}
      </View>
      {trailing ?? <RadioMark selected={selected} dim={muted} />}
    </Pressable>
  );
}

export function SettingsHint({ children }: { children: string }) {
  const theme = useTheme();
  return <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: theme.colors.textSecondary, marginTop: -14 }}>{children}</Text>;
}

/** Outlined full-width pill (Sign out, Keep my account). */
export function OutlineButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: ReactNode }) {
  const theme = useTheme();
  const tint = useRowTint();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        borderColor: theme.mode === 'dark' ? '#3A4145' : '#C9CEC1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: pressed ? tint : 'transparent',
      })}>
      {icon}
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: theme.colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

/** "CREWUP 1.0.0" in mono under the drawer and Settings. */
export function VersionStamp({ version, center }: { version?: string | null; center?: boolean }) {
  const theme = useTheme();
  if (!version) return null;
  return (
    <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, letterSpacing: 0.9, color: theme.colors.textSecondary, textAlign: center ? 'center' : 'left' }}>
      {`CREWUP ${version}`}
    </Text>
  );
}
