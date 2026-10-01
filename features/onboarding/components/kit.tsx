import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { hapticImpact, hapticSelection } from '@/lib/haptics';
import { fontFamily, shouldUppercaseLabels, useTheme, useThemedStyles } from '@/theme';

/**
 * Onboarding "Altitude Light" kit — design/flight-crew-activity-app-branding/project/CrewUp Onboarding.dc.html.
 * Oversized tight titles, full-width pill CTAs, borderless filled inputs, ink-fill single choices, lime multi-select.
 */

export function StepTitle({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          fontFamily: fontFamily.jakartaBold,
          fontSize: 27,
          lineHeight: 30,
          letterSpacing: -0.7,
          color: theme.colors.textPrimary,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function StepSubtitle({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const theme = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: fontFamily.interRegular,
          fontSize: 14.5,
          lineHeight: 21,
          color: theme.colors.textSecondary,
          marginTop: 10,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

/** Small mono section label, e.g. DATE OF BIRTH. */
export function MonoLabel({ children, style }: { children: string; style?: TextStyle }) {
  const theme = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: fontFamily.monoMedium,
          fontSize: 11,
          letterSpacing: 1.1,
          color: theme.colors.textSecondary,
          textTransform: shouldUppercaseLabels() ? 'uppercase' : 'none',
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

/** Mono status tag that sits inside a field (AVAILABLE, OPTIONAL) or a lime country chip. */
export function MonoTag({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'positive' | 'chip' }) {
  const theme = useTheme();
  const chip = tone === 'chip';
  return (
    <Text
      style={{
        fontFamily: fontFamily.monoMedium,
        fontSize: chip ? 11 : 10.5,
        color: chip ? theme.colors.onFill : tone === 'positive' ? theme.colors.accentText : theme.colors.textTertiary,
        backgroundColor: chip ? theme.colors.fill : undefined,
        paddingHorizontal: chip ? 10 : 0,
        paddingVertical: chip ? 6 : 0,
        borderRadius: chip ? 14 : 0,
        overflow: 'hidden',
        textTransform: shouldUppercaseLabels() ? 'uppercase' : 'none',
      }}>
      {label}
    </Text>
  );
}

function useFieldStyles() {
  return useThemedStyles((t) => ({
    wrap: { marginBottom: 10 },
    box: {
      minHeight: 60,
      borderRadius: 14,
      backgroundColor: t.colors.field,
      borderWidth: 2,
      borderColor: t.colors.field,
      paddingHorizontal: 14,
      paddingVertical: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    boxFocused: { backgroundColor: t.colors.card, borderColor: t.colors.ink },
    boxError: { borderColor: t.colors.statusOnDuty },
    content: { flex: 1, justifyContent: 'center', gap: 2 },
    label: { fontFamily: fontFamily.interMedium, fontSize: 11.5, lineHeight: 15, color: t.colors.textSecondary },
    value: {
      fontFamily: fontFamily.interMedium,
      fontSize: 16,
      lineHeight: 21,
      color: t.colors.textPrimary,
      padding: 0,
      margin: 0,
    },
    placeholder: { color: t.colors.textTertiary },
    helper: {
      fontFamily: fontFamily.interRegular,
      fontSize: 12,
      lineHeight: 17,
      color: t.colors.textTertiary,
      paddingLeft: 4,
      marginTop: 6,
    },
    error: { color: t.colors.statusOnDuty },
  }));
}

function FieldHelper({ error, hint }: { error?: string; hint?: ReactNode }) {
  const styles = useFieldStyles();
  if (error) return <Text style={[styles.helper, styles.error]}>{error}</Text>;
  if (!hint) return null;
  return typeof hint === 'string' ? <Text style={styles.helper}>{hint}</Text> : <>{hint}</>;
}

/** Borderless filled text field with the label inside. Focus draws a 2px ink ring on white. */
export function FilledField({
  label,
  value,
  onChangeText,
  error,
  hint,
  trailing,
  prefix,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  trailing?: ReactNode;
  /** Fixed text before the value, e.g. "@" for a username. */
  prefix?: string;
  style?: ViewStyle;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'style'>) {
  const theme = useTheme();
  const styles = useFieldStyles();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.box, focused && styles.boxFocused, error ? styles.boxError : null]}>
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {prefix ? <Text style={styles.value}>{prefix}</Text> : null}
            <TextInput
              {...inputProps}
              accessibilityLabel={label}
              value={value}
              onChangeText={onChangeText}
              placeholderTextColor={theme.colors.textTertiary}
              onFocus={(event) => {
                setFocused(true);
                onFocus?.(event);
              }}
              onBlur={(event) => {
                setFocused(false);
                onBlur?.(event);
              }}
              style={[styles.value, { flex: 1 }]}
            />
          </View>
        </View>
        {trailing}
      </View>
      <FieldHelper error={error} hint={hint} />
    </View>
  );
}

export function Chevron({ direction = 'down', color, size = 12 }: { direction?: 'down' | 'left'; color?: string; size?: number }) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.textSecondary;
  if (direction === 'left') {
    return (
      <Svg width={(size * 10) / 16} height={size} viewBox="0 0 10 16">
        <Path d="M8 2L2 8l6 6" stroke={stroke} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={(size * 8) / 12} viewBox="0 0 12 8">
      <Path d="M1.5 1.5L6 6l4.5-4.5" stroke={stroke} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SearchGlyph({ color }: { color?: string }) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.textSecondary;
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Path d="M7 1.8a5.2 5.2 0 1 1 0 10.4A5.2 5.2 0 0 1 7 1.8z" stroke={stroke} strokeWidth={1.8} fill="none" />
      <Path d="M11 11l3.2 3.2" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckBadge({ size = 22, ring }: { size?: number; ring?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.ink,
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Svg width={size * 0.45} height={size * 0.36} viewBox="0 0 10 8">
        <Path d="M1 4l2.8 2.8L9 1.2" stroke={theme.colors.fill} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

/** Tappable filled field (date, airline, airport, country code). Label inside, value below, optional chevron. */
export function FilledPressField({
  label,
  value,
  placeholder,
  onPress,
  error,
  hint,
  disabled,
  chevron = true,
  style,
  accessibilityHint,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  onPress: () => void;
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
  chevron?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}) {
  const styles = useFieldStyles();
  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        disabled={disabled}
        onPress={() => {
          hapticImpact();
          onPress();
        }}
        style={({ pressed }) => [
          styles.box,
          error ? styles.boxError : null,
          { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        ]}>
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, value ? null : styles.placeholder]} numberOfLines={1}>
            {value || placeholder || ' '}
          </Text>
        </View>
        {chevron ? <Chevron /> : null}
      </Pressable>
      <FieldHelper error={error} hint={hint} />
    </View>
  );
}

/** Single choice with ink fill (gender, role). Never lime, so it never competes with the CTA. */
export function ChoicePill({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={({ pressed }) => [
        {
          height: 52,
          borderRadius: 26,
          paddingHorizontal: 16,
          backgroundColor: selected ? theme.colors.ink : theme.colors.field,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fontFamily.jakartaBold,
          fontSize: 15,
          color: selected ? theme.colors.ground : theme.colors.textPrimary,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Lime multi-select pill. Lime is fill only, the label stays ink. */
export function TogglePill({
  label,
  selected,
  onPress,
  size = 'md',
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  size?: 'md' | 'sm';
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const md = size === 'md';
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={({ pressed }) => ({
        height: md ? 42 : 34,
        borderRadius: md ? 21 : 17,
        paddingHorizontal: md ? 16 : 13,
        backgroundColor: selected ? theme.colors.fill : theme.colors.card,
        borderWidth: 1.5,
        borderColor: selected ? theme.colors.fill : theme.colors.hairline,
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}>
      <Text
        style={{
          fontFamily: fontFamily.interMedium,
          fontSize: md ? 14.5 : 13,
          color: selected ? theme.colors.onFill : theme.colors.textPrimary,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Large radio row used for the display-name choice. */
export function RadioPill({ label, selected, onPress, accessibilityLabel }: { label: string; selected: boolean; onPress: () => void; accessibilityLabel?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: selected ? theme.colors.ink : theme.colors.field,
        backgroundColor: selected ? theme.colors.card : theme.colors.field,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: pressed ? 0.85 : 1,
      })}>
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15.5, color: theme.colors.textPrimary }}>
        {label}
      </Text>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? theme.colors.ink : theme.colors.textTertiary,
          backgroundColor: selected ? theme.colors.fill : 'transparent',
        }}
      />
    </Pressable>
  );
}

/** Full-width pill CTA. Disabled turns into a quiet track-coloured pill instead of fading lime. */
export function PillCta({
  label,
  onPress,
  disabled,
  loading,
  tone = 'lime',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'lime' | 'ink';
}) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const bg = disabled ? theme.colors.track : tone === 'ink' ? theme.colors.ink : theme.colors.fill;
  const fg = disabled ? theme.colors.textTertiary : tone === 'ink' ? theme.colors.ground : theme.colors.onFill;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 28,
        backgroundColor: pressed && !disabled && tone === 'lime' ? theme.colors.accentPressed : bg,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: fg }}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Plain text action (Skip, Skip for now, Cancel). */
export function TextAction({ label, onPress, style }: { label: string; onPress: () => void; style?: TextStyle }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
      {({ pressed }) => (
        <Text
          style={[
            { fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary, opacity: pressed ? 0.6 : 1 },
            style,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** The dark "curtain" screens (sign-in, house rules, on the list) always use the dark ground, whatever the theme. */
export const DARK = {
  ground: '#0E1113',
  card: '#1C2124',
  cardBorder: '#2C3134',
  ink: '#EDF1F2',
  muted: '#A7B1B5',
  faint: '#7D878B',
  outline: '#4A5256',
  rule: '#23282B',
  lime: '#A8E05F',
  limePressed: '#B8EA74',
} as const;

/** Outlined pill for the dark screens (Continue with Google, Check for updates). */
export function DarkOutlinePill({
  label,
  onPress,
  icon,
  loading,
  height = 56,
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  loading?: boolean;
  height?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading) }}
      disabled={loading}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        height,
        borderRadius: height / 2,
        borderWidth: 1.5,
        borderColor: pressed ? DARK.ink : DARK.outline,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      {icon ? <View style={{ position: 'absolute', left: 22, top: 0, bottom: 0, justifyContent: 'center' }}>{icon}</View> : null}
      {loading ? (
        <ActivityIndicator color={DARK.ink} />
      ) : (
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: height >= 56 ? 16 : 15, color: DARK.ink }}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Lime CTA for the dark screens; identical in light and dark theme. */
export function DarkLimePill({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading) }}
      disabled={loading}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 28,
        backgroundColor: pressed ? DARK.limePressed : DARK.lime,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      {loading ? (
        <ActivityIndicator color={DARK.ground} />
      ) : (
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: DARK.ground }}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Bold text-only button (Log in, Skip, Sign out, Cancel) in the 44pt row the design uses. */
export function TextPillAction({ label, onPress, color }: { label: string; onPress: () => void; color?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: color ?? theme.colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}
