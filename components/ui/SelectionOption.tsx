import { Pressable, Text } from 'react-native';
import { useThemedStyles } from '@/theme';

export function SelectionOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    row: {
      paddingVertical: t.spacing.sm + 2,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.input,
      marginBottom: t.spacing.xs,
      backgroundColor: selected ? t.colors.accentSubtle : 'transparent',
    },
    text: {
      ...t.typography.body,
      color: selected ? t.colors.accent : t.colors.textPrimary,
    },
  }));

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}
