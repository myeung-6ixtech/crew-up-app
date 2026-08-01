import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme';

export type PillSelectorOption<T extends string> = {
  value: T;
  label: string;
};

function PillSelector<T extends string>({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    pill: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: selected ? t.colors.accent : t.colors.hairline,
      backgroundColor: selected ? t.colors.accentSubtle : t.colors.bgSurface,
    },
    text: {
      ...t.typography.bodyStrong,
      color: selected ? t.colors.accent : t.colors.textSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
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
  onChange,
}: {
  label?: string;
  options: PillSelectorOption<T>[];
  value?: T;
  onChange: (value: T) => void;
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
            selected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}
