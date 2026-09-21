import { ScrollView, View } from 'react-native';
import { Skeleton } from '@/components/ui';
import { useThemedStyles } from '@/theme';

export function SuggestedFriendsSkeleton() {
  const styles = useThemedStyles((t) => ({
    section: { marginBottom: t.spacing.xl, gap: t.spacing.sm },
    row: {
      flexDirection: 'row',
      gap: t.spacing.md,
      paddingVertical: t.spacing.xs,
    },
    card: {
      width: 132,
      alignItems: 'center',
      gap: t.spacing.sm,
    },
  }));

  return (
    <View style={styles.section}>
      <Skeleton width="38%" height={14} borderRadius={6} />
      <Skeleton width="72%" height={12} borderRadius={6} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.card}>
              <Skeleton width={72} height={72} borderRadius={36} />
              <Skeleton width={88} height={14} borderRadius={6} />
              <Skeleton width={72} height={12} borderRadius={6} />
              <Skeleton width="100%" height={32} borderRadius={8} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
