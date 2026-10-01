import type { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useStorageFileUri } from '@/hooks/useStorageFileUri';
import { hapticImpact } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import { MonoLabel } from '@/features/onboarding/components/kit';

/**
 * Shared "Altitude Light" pieces for the app screens — design/…/CrewUp - Friends - Events.dc.html.
 * Onboarding primitives (MonoLabel, PillCta, Chevron, …) live in features/onboarding/components/kit.
 */

const AVATAR_TONES = [
  { bg: '#A8E05F', fg: '#0E1113' },
  { bg: '#DDE1D6', fg: '#0E1113' },
  { bg: '#0E1113', fg: '#A8E05F' },
] as const;

function toneFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function initialsFor(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase() || '?';
}

/** Photo, or initials on one of three brand tones picked from the person's id. */
export function CrewAvatar({
  name,
  fileId,
  seed,
  size = 48,
  tone,
}: {
  name?: string | null;
  fileId?: string | null;
  seed?: string | null;
  size?: number;
  tone?: 'ink' | 'lime' | 'track';
}) {
  const { uri, headers } = useStorageFileUri(fileId);
  const colors = tone
    ? AVATAR_TONES[tone === 'lime' ? 0 : tone === 'track' ? 1 : 2]
    : toneFor(seed ?? name ?? '');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {uri ? (
        <Image source={headers ? { uri, headers } : { uri }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: Math.round(size * 0.355), color: colors.fg }}>
          {initialsFor(name)}
        </Text>
      )}
    </View>
  );
}

/** 40pt round grey button used in screen headers (menu, add friend, back, filters). */
export function CircleButton({
  children,
  onPress,
  accessibilityLabel,
  tone = 'field',
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'field' | 'ink';
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: tone === 'ink' ? theme.colors.ink : theme.colors.field,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}>
      {children}
    </Pressable>
  );
}

export function MenuGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={14} viewBox="0 0 18 14">
      <Path d="M1 1h16M1 7h16M1 13h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function BackGlyph({ color }: { color: string }) {
  return (
    <Svg width={10} height={16} viewBox="0 0 10 16">
      <Path d="M8 2L2 8l6 6" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusGlyph({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M8 2v12M2 8h12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function PersonPlusGlyph({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx={9} cy={8} r={4} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M1.5 20.5c.7-3.8 3.8-6.5 7.5-6.5s6.8 2.7 7.5 6.5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M19 7v6M16 10h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function RowChevron({ color }: { color: string }) {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14">
      <Path d="M1.5 1.5L6.5 7l-5 5.5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Large tab title row: title left, round actions right. */
export function TabTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const theme = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 24 }}>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: fontFamily.jakartaBold, fontSize: 27, letterSpacing: -0.7, color: theme.colors.textPrimary }}>
          {title}
        </Text>
        {right ? <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View> : null}
      </View>
      {subtitle ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary, paddingTop: 4, paddingHorizontal: 24 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Pushed-screen bar: round back left, centred title, spacer right. */
export function PushedTopBar({ title, onBack, right }: { title?: string; onBack: () => void; right?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 6, paddingHorizontal: 20 }}>
      <CircleButton accessibilityLabel="Back" onPress={onBack}>
        <BackGlyph color={theme.colors.textPrimary} />
      </CircleButton>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>
        {title}
      </Text>
      <View style={{ width: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

/** Small lime tags for languages, activities and interests. */
export function LimePills({ names }: { names: string[] }) {
  const theme = useTheme();
  if (!names.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      {names.map((name) => (
        <View key={name} style={{ backgroundColor: theme.colors.fill, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 12, color: theme.colors.onFill }}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

/** Mono label above a row of lime pills. Left off when empty. */
export function PillGroup({ label, names }: { label: string; names: string[] }) {
  if (!names.length) return null;
  return (
    <View style={{ gap: 8 }}>
      <MonoLabel style={{ fontSize: 10.5 }}>{label}</MonoLabel>
      <LimePills names={names} />
    </View>
  );
}

/** 40pt pill buttons: lime fill, ink fill, or outlined. */
export function SmallPillButton({
  label,
  onPress,
  tone = 'outline',
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'lime' | 'outline' | 'ink' | 'done';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const bg =
    tone === 'lime' ? theme.colors.fill : tone === 'ink' ? theme.colors.ink : tone === 'done' ? theme.colors.field : 'transparent';
  const fg = tone === 'ink' ? theme.colors.ground : tone === 'done' ? theme.colors.textSecondary : theme.colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
      disabled={disabled || loading}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => [
        {
          height: 40,
          borderRadius: 20,
          paddingHorizontal: 18,
          backgroundColor: bg,
          borderWidth: tone === 'outline' ? 1.5 : 0,
          borderColor: '#C9CEC1',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: fg }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Avatar, name, one muted line, optional trailing content. */
export function PersonRow({
  name,
  subtitle,
  fileId,
  seed,
  trailing,
  onPress,
  divider,
  extra,
}: {
  name: string;
  subtitle?: string | null;
  fileId?: string | null;
  seed?: string | null;
  trailing?: ReactNode;
  onPress?: () => void;
  divider?: boolean;
  extra?: ReactNode;
}) {
  const theme = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <CrewAvatar name={name} fileId={fileId} seed={seed} />
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
          {name}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
            {subtitle}
          </Text>
        ) : null}
        {extra}
      </View>
      {trailing}
    </View>
  );
  const style = divider ? { borderBottomWidth: 1, borderBottomColor: theme.colors.hairline } : null;
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}>
      {body}
    </Pressable>
  );
}

/** Label-left / value-right line inside a white card. */
export function FactRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.hairline,
      }}>
      <MonoLabel style={{ fontSize: 10, color: theme.colors.textTertiary }}>{label}</MonoLabel>
      <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary }}>
        {value}
      </Text>
    </View>
  );
}

export function WhiteCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return <View style={[{ backgroundColor: theme.colors.card, borderRadius: 20, paddingHorizontal: 18 }, style]}>{children}</View>;
}
