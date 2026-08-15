import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme';

export function FormSection({
  title,
  children,
  isFirst = false,
}: {
  title?: string;
  children: React.ReactNode;
  isFirst?: boolean;
}) {
  const styles = useThemedStyles((t) => ({
    wrap: {
      marginBottom: t.spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.hairline,
      marginBottom: t.spacing.lg,
      marginTop: isFirst ? 0 : t.spacing.sm,
    },
    title: {
      ...t.typography.headline,
      color: t.colors.textPrimary,
      marginBottom: t.spacing.md,
    },
  }));

  return (
    <View style={styles.wrap}>
      {!isFirst ? <View style={styles.divider} /> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}
