import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/icons';
import { useThemedStyles, useTheme } from '@/theme';

const BADGE_SIZE = 44;
const SQUIRCLE_RADIUS = 13;

export function usePickerFieldStyles() {
  return useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 6 },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.input,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm + 2,
      backgroundColor: t.colors.bgSurface,
      minHeight: 56,
      gap: t.spacing.md,
    },
    fieldError: { borderColor: t.colors.statusOnDuty },
    fieldDisabled: { opacity: 0.6 },
    content: { flex: 1, justifyContent: 'center', gap: 2 },
    title: {
      ...t.typography.body,
      color: t.colors.textPrimary,
    },
    titlePlaceholder: {
      color: t.colors.textTertiary,
    },
    subtitle: {
      ...t.typography.bodySm,
      color: t.colors.textSecondary,
    },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
    squircle: {
      width: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: SQUIRCLE_RADIUS,
      backgroundColor: t.colors.accentSubtle,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    squircleMuted: {
      backgroundColor: t.colors.bgSurfaceRaised,
    },
    squircleCode: {
      ...t.typography.bodyStrong,
      color: t.colors.accent,
      letterSpacing: 0.5,
    },
    squirclePlaceholder: {
      ...t.typography.bodyStrong,
      color: t.colors.textTertiary,
    },
    list: { flex: 1, marginTop: t.spacing.sm },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      paddingVertical: t.spacing.sm + 2,
      paddingHorizontal: t.spacing.xs,
      borderRadius: t.radius.input,
      marginBottom: t.spacing.xs,
    },
    listRowSelected: {
      backgroundColor: t.colors.accentSubtle,
    },
    listContent: { flex: 1, gap: 2 },
    empty: { paddingVertical: t.spacing.lg },
  }));
}

export function PickerFieldShell({
  label,
  error,
  disabled,
  onPress,
  accessibilityHint,
  leading,
  title,
  subtitle,
  placeholder,
}: {
  label: string;
  error?: string;
  disabled?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
  leading: ReactNode;
  title: string;
  subtitle?: string | null;
  placeholder?: boolean;
}) {
  const theme = useTheme();
  const styles = usePickerFieldStyles();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.field,
          error ? styles.fieldError : null,
          disabled ? styles.fieldDisabled : null,
          { opacity: pressed && !disabled ? 0.72 : 1 },
        ]}>
        {leading}
        <View style={styles.content}>
          <Text
            style={[styles.title, placeholder ? styles.titlePlaceholder : null]}
            numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <AppIcon name="chevronDown" size={20} color={theme.colors.textTertiary} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function SelectionSquircle({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  const styles = usePickerFieldStyles();
  return <View style={[styles.squircle, muted ? styles.squircleMuted : null]}>{children}</View>;
}

export { BADGE_SIZE, SQUIRCLE_RADIUS };
