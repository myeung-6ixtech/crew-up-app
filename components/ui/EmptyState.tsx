import { View, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useThemedStyles } from '@/theme';

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    wrap: {
      padding: t.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { ...t.typography.bodyStrong, color: t.colors.textPrimary, textAlign: 'center' },
    body: {
      ...t.typography.body,
      color: t.colors.textSecondary,
      marginTop: t.spacing.sm,
      textAlign: 'center',
      maxWidth: 320,
    },
    action: {
      marginTop: t.spacing.lg,
      width: '100%',
      maxWidth: 280,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" noTopMargin />
        </View>
      ) : null}
    </View>
  );
}
