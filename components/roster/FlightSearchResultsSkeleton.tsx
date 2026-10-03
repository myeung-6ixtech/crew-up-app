import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useThemedStyles } from '@/theme';

const PLACEHOLDER_COUNT = 5;

export function FlightSearchResultsSkeleton() {
  const styles = useThemedStyles((t) => ({
    wrap: { width: '100%', gap: 10 },
    row: {
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: t.colors.card,
      gap: 10,
    },
    topLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
  }));

  return (
    <View style={styles.wrap} accessibilityLabel="Loading flights">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.topLine}>
            <Skeleton width={72} height={18} borderRadius={6} />
            <Skeleton width={120} height={14} borderRadius={6} />
          </View>
          <Skeleton width={96} height={16} borderRadius={6} />
          <Skeleton width="78%" height={14} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}
