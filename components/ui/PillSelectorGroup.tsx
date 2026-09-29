import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme';

export type PillSelectorOption<T extends string> = {
  value: T;
  label: string;
  accessibilityLabel?: string;
};

function PillSelector<T extends string>({
  label,
  selected,
  onPress,
  tone,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone: 'subtle' | 'fill';
  accessibilityLabel?: string;
}) {
  const styles = useThemedStyles((t) => ({
    pill: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: selected ? (tone === 'fill' ? t.colors.fill : t.colors.accentText) : t.colors.hairline,
      backgroundColor: selected
        ? tone === 'fill'
          ? t.colors.fill
          : t.colors.accentSubtle
        : t.colors.bgSurface,
    },
    text: {
      ...t.typography.bodyStrong,
      color: selected ? (tone === 'fill' ? t.colors.onFill : t.colors.accentText) : t.colors.textSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, { opacity: pressed ? 0.72 : 1 }]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

export function PillSelectorGroup<T extends string>({
  label,
  options,
  value,
  values,
  onChange,
  onToggle,
  tone = 'subtle',
  multiple = false,
}: {
  label?: string;
  options: PillSelectorOption<T>[];
  value?: T;
  values?: T[];
  onChange?: (value: T) => void;
  onToggle?: (value: T) => void;
  /** Selected pill: tinted text, or a solid lime fill. */
  tone?: 'subtle' | 'fill';
  /** More than one pill can stay selected. */
  multiple?: boolean;
}) {
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: t.spacing.sm },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing.sm,
    },
  }));

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((option) => (
          <PillSelector
            key={option.value}
            label={option.label}
            accessibilityLabel={option.accessibilityLabel}
            selected={multiple ? (values ?? []).includes(option.value) : value === option.value}
            tone={tone}
            onPress={() => (multiple ? onToggle?.(option.value) : onChange?.(option.value))}
          />
        ))}
      </View>
    </View>
  );
}
