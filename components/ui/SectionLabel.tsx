import { Text } from 'react-native';
import { useThemedStyles } from '@/theme';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const styles = useThemedStyles((t) => ({
    label: {
      ...t.typography.label,
      color: t.colors.textTertiary,
      marginBottom: t.spacing.sm,
      marginTop: t.spacing.xl,
    },
  }));

  return <Text style={styles.label}>{children}</Text>;
}
