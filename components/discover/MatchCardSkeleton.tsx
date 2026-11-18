import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTheme } from '@/theme';

/** A MatchCard-shaped placeholder while Crossing Paths loads: avatar, name and detail lines, then the Poke button. */
export function MatchCardSkeleton() {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 14, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, gap: 7 }}>
          <Skeleton width="55%" height={14} borderRadius={7} />
          <Skeleton width="80%" height={11} borderRadius={6} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="45%" height={11} borderRadius={6} />
        <Skeleton width={84} height={36} borderRadius={18} />
      </View>
    </View>
  );
}
