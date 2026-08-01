import { View, Text } from 'react-native';
import { useThemedStyles } from '@/theme';

export function EmptyState({ title, body }: { title: string; body?: string }) {
  const styles = useThemedStyles((t) => ({
    wrap: { padding: t.spacing.xl, alignItems: 'center' },
    title: { ...t.typography.bodyStrong, color: t.colors.textPrimary, textAlign: 'center' },
    body: {
      ...t.typography.body,
      color: t.colors.textSecondary,
      marginTop: t.spacing.sm,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}
