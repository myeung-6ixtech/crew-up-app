import { ScrollView, View } from 'react-native';
import { Skeleton } from '@/components/ui';
import { useThemedStyles } from '@/theme';

export function FriendsTabSkeleton() {
  const styles = useThemedStyles((t) => ({
    wrap: { padding: t.spacing.lg, gap: t.spacing.lg },
    header: { gap: t.spacing.sm },
    suggestedRow: {
      flexDirection: 'row',
      gap: t.spacing.md,
      paddingVertical: t.spacing.xs,
    },
    suggestedCard: {
      width: 128,
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    friendCard: {
      gap: t.spacing.sm,
      marginBottom: t.spacing.md,
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Skeleton width="42%" height={28} borderRadius={8} />
        <Skeleton width="72%" height={16} borderRadius={6} />
      </View>

      <Skeleton width="38%" height={14} borderRadius={6} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.suggestedRow}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.suggestedCard}>
              <Skeleton width={72} height={72} borderRadius={36} />
              <Skeleton width={88} height={14} borderRadius={6} />
              <Skeleton width={72} height={12} borderRadius={6} />
              <Skeleton width="100%" height={32} borderRadius={8} />
            </View>
          ))}
        </View>
      </ScrollView>

      <Skeleton width="32%" height={14} borderRadius={6} />
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.friendCard}>
          <Skeleton width="100%" height={72} borderRadius={12} />
        </View>
      ))}
    </View>
  );
}
