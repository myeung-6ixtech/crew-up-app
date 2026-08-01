import { Pressable, ActivityIndicator, View, Text } from 'react-native';
import { useThemedStyles, useTheme } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  noTopMargin,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: import('react-native').ViewStyle;
  noTopMargin?: boolean;
}) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    base: {
      minHeight: 52,
      borderRadius: t.radius.cta,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: t.spacing.sm,
      paddingHorizontal: t.spacing.lg,
    },
    primary: { backgroundColor: t.colors.accent },
    primaryPressed: { backgroundColor: t.colors.accentPressed },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: t.colors.hairline,
    },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: t.colors.statusOnDuty },
    disabled: { opacity: 0.4 },
    content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    icon: { marginRight: t.spacing.sm },
    labelPrimary: { ...t.typography.bodyStrong, color: t.colors.textInverse },
    labelSecondary: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
    labelGhost: { ...t.typography.bodyStrong, color: t.colors.accent },
    labelDestructive: { ...t.typography.bodyStrong, color: t.colors.textInverse },
  }));

  const labelStyle =
    variant === 'primary' || variant === 'destructive'
      ? styles.labelPrimary
      : variant === 'ghost'
        ? styles.labelGhost
        : styles.labelSecondary;

  const spinnerColor =
    variant === 'secondary' || variant === 'ghost'
      ? theme.colors.accent
      : theme.colors.textInverse;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        noTopMargin && { marginTop: 0 },
        variant === 'primary' && (pressed ? styles.primaryPressed : styles.primary),
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'destructive' && styles.destructive,
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={labelStyle}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
