import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { BackGlyph, CircleButton } from '@/components/crew/kit';
import { MonoLabel, PillCta, TextPillAction } from '@/features/onboarding/components/kit';
import { hapticImpact } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

/**
 * Add Trip and roster screens — design/…/CrewUp - Add Trip Flow.dc.html.
 * Round back button, a quiet centred stack title, and pill footers.
 */

export function FlowTopBar({ title, onBack, backLabel }: { title?: string; onBack: () => void; backLabel: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 6, paddingHorizontal: 20 }}>
      <CircleButton accessibilityLabel={backLabel} onPress={onBack}>
        <BackGlyph color={theme.colors.textPrimary} />
      </CircleButton>
      <Text numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textSecondary }}>
        {title ?? ''}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

export function FlowTitle({ children, center }: { children: string; center?: boolean }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: fontFamily.jakartaBold,
        fontSize: 27,
        lineHeight: 30,
        letterSpacing: -0.7,
        color: theme.colors.textPrimary,
        textAlign: center ? 'center' : 'left',
      }}>
      {children}
    </Text>
  );
}

/** Centred header: title, lime route chip, the date, an optional accent line, then a hint. */
export function FlowHeader({
  title,
  chip,
  date,
  accent,
  hint,
}: {
  title: string;
  chip?: string;
  date?: string;
  accent?: string;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 6, paddingTop: 18, paddingHorizontal: 24 }}>
      <FlowTitle center>{title}</FlowTitle>
      {chip ? (
        <Text
          style={{
            fontFamily: fontFamily.monoMedium,
            fontSize: 13,
            color: theme.colors.onFill,
            backgroundColor: theme.colors.fill,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 14,
            overflow: 'hidden',
          }}>
          {chip}
        </Text>
      ) : null}
      {date ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary, marginTop: 4 }}>{date}</Text> : null}
      {accent ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.accentText }}>{accent}</Text> : null}
      {hint ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, textAlign: 'center' }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

type FooterAction = { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };

/** Lime primary, outlined secondary, and a text action (Back / Cancel / Later). */
export function FlowFooter({
  primary,
  secondary,
  tertiary,
  bottomInset,
  above,
}: {
  primary?: FooterAction;
  secondary?: FooterAction;
  tertiary?: FooterAction;
  bottomInset: number;
  above?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ paddingTop: 16, paddingHorizontal: 24, paddingBottom: Math.max(bottomInset, 14), gap: 10, backgroundColor: theme.colors.bgCanvas }}>
      {above}
      {primary ? <PillCta label={primary.label} onPress={primary.onPress} disabled={primary.disabled} loading={primary.loading} /> : null}
      {secondary ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: Boolean(secondary.disabled) }}
          disabled={secondary.disabled}
          onPress={() => {
            hapticImpact();
            secondary.onPress();
          }}
          style={({ pressed }) => ({
            height: 54,
            borderRadius: 27,
            borderWidth: 1.5,
            borderColor: secondary.disabled ? theme.colors.hairline : '#C9CEC1',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: secondary.disabled ? theme.colors.textTertiary : theme.colors.textPrimary }}>
            {secondary.label}
          </Text>
        </Pressable>
      ) : null}
      {tertiary ? <TextPillAction label={tertiary.label} onPress={tertiary.onPress} /> : null}
    </View>
  );
}

/** Centred icon, title and line for an empty or failed results page. */
export function FlowNotice({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 36 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 19, lineHeight: 24, letterSpacing: -0.3, color: theme.colors.textPrimary, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary, textAlign: 'center' }}>{body}</Text>
    </View>
  );
}

/** Amber mono chip with a warning glyph: COULDN'T READ, CHECK CITY. */
export function WarnChip({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F6E7B8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, alignSelf: 'flex-start' }}>
      <Svg width={11} height={10} viewBox="0 0 12 11">
        <Path d="M6 1l5 9H1z" stroke="#6B4E00" strokeWidth={1.4} fill="none" strokeLinejoin="round" />
        <Path d="M6 4.5v2.3" stroke="#6B4E00" strokeWidth={1.4} strokeLinecap="round" />
      </Svg>
      <MonoLabel style={{ fontSize: 10, letterSpacing: 0.4, color: '#6B4E00' }}>{label}</MonoLabel>
    </View>
  );
}

export function PlaneGlyph({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill={color} />
    </Svg>
  );
}

export function UploadGlyph({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 15V4M7 8.5L12 4l5 4.5" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 14v4.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V14" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Rect x={3} y={4.5} width={18} height={16.5} rx={3} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function SearchOffGlyph({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6.5} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M15.5 15.5L21 21M8 8l5 5M13 8l-5 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CloudOffGlyph({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M7 18h10.5a4 4 0 00.6-7.95A6 6 0 006.4 9.1 4.5 4.5 0 007 18z" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Path d="M4 4l16 16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function SwapGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path d="M3 6h11M11 3l3 3-3 3M15 12H4M7 9l-3 3 3 3" stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
