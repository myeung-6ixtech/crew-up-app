import { View, Text } from 'react-native';
import { useThemedStyles } from '@/theme';

export function Badge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'verified' | 'status';
}) {
  const styles = useThemedStyles((t) => ({
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: tone === 'verified' ? t.colors.accentSubtle : t.colors.bgSurface,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radius.pill,
    },
    textDefault: { ...t.typography.label, color: t.colors.accent, textTransform: 'none' as const },
    textVerified: { ...t.typography.label, color: t.colors.statusVerified, textTransform: 'none' as const },
    textStatus: { ...t.typography.label, color: t.colors.textSecondary, textTransform: 'none' as const },
  }));

  const textStyle =
    tone === 'verified' ? styles.textVerified : tone === 'status' ? styles.textStatus : styles.textDefault;

  return (
    <View style={styles.badge}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}
