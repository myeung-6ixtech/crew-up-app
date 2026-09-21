import { View } from 'react-native';
import { Skeleton } from '@/components/ui';
import { useThemedStyles } from '@/theme';

export function FriendUserRowSkeleton() {
  const styles = useThemedStyles((t) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.md,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      backgroundColor: t.colors.bgSurface,
      marginBottom: t.spacing.sm,
    },
    meta: { flex: 1, gap: t.spacing.xs },
  }));

  return (
    <View style={styles.card}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.meta}>
        <Skeleton width="55%" height={16} borderRadius={6} />
        <Skeleton width="40%" height={12} borderRadius={6} />
      </View>
      <Skeleton width={88} height={34} borderRadius={8} />
    </View>
  );
}
