import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme';

export function NumberStepperField({
  label,
  value,
  onChange,
  min = 1,
  max = 999,
  error,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  error?: string;
}) {
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 6 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.input,
      backgroundColor: t.colors.bgSurface,
      overflow: 'hidden',
    },
    rowError: { borderColor: t.colors.statusOnDuty },
    button: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.bgSurface,
    },
    buttonDisabled: { opacity: 0.35 },
    buttonText: {
      ...t.typography.headline,
      color: t.colors.accent,
      lineHeight: 28,
    },
    valueWrap: {
      minWidth: 56,
      paddingHorizontal: t.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: t.colors.hairline,
    },
    value: {
      ...t.typography.numericLg,
      color: t.colors.textPrimary,
    },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
  }));

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease"
          onPress={decrement}
          disabled={value <= min}
          style={({ pressed }) => [
            styles.button,
            value <= min ? styles.buttonDisabled : null,
            { opacity: pressed && value > min ? 0.72 : 1 },
          ]}>
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{value}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increase"
          onPress={increment}
          disabled={value >= max}
          style={({ pressed }) => [
            styles.button,
            value >= max ? styles.buttonDisabled : null,
            { opacity: pressed && value < max ? 0.72 : 1 },
          ]}>
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
