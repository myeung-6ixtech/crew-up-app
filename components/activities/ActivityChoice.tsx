import { Pressable, Text, View } from 'react-native';
import { ActivityIcon } from '@/components/icons/ActivityIcon';
import { CheckBadge, TogglePill } from '@/features/onboarding/components/kit';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { Activity } from '@/types/domain';

/**
 * The activity and interest selectors, shared by onboarding (steps 1 and 2) and the Activities / Interests sheet
 * (profile edit, create and edit meetup), so both look and behave the same.
 */

/** 72px circle with the activity's icon; lime fill and a check badge when picked. The label wraps to two lines. */
export function ActivityBubble({ activity, selected, onPress }: { activity: Activity; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={activity.name}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={({ pressed }) => ({ width: '25%', alignItems: 'center', gap: 6, paddingHorizontal: 4, opacity: pressed ? 0.8 : 1 })}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: selected ? theme.colors.fill : theme.colors.field,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIcon
          slug={activity.slug}
          name={activity.name}
          fallback={activity.icon}
          size={32}
          color={selected ? theme.colors.onFill : theme.colors.textSecondary}
        />
        {selected ? (
          <View style={{ position: 'absolute', top: -2, right: -2 }}>
            <CheckBadge ring={theme.colors.ground} />
          </View>
        ) : null}
      </View>
      {/* Two lines, never cut: "Music event / festival" shows in full. */}
      <Text
        numberOfLines={2}
        style={{ fontFamily: fontFamily.interMedium, fontSize: 12, lineHeight: 15, color: theme.colors.textPrimary, textAlign: 'center' }}>
        {activity.name}
      </Text>
    </Pressable>
  );
}

/** Bubbles four across, wrapping. */
export function ActivityBubbleGrid({
  items,
  selectedIds,
  onToggle,
}: {
  items: Activity[];
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginTop: 12, marginHorizontal: -4 }}>
      {items.map((activity) => (
        <ActivityBubble key={activity.id} activity={activity} selected={selectedIds.includes(activity.id)} onPress={() => onToggle(activity.id)} />
      ))}
    </View>
  );
}

/** The small toggle pill for an interest; lime when picked. */
export function InterestPill({ activity, selected, onPress }: { activity: Activity; selected: boolean; onPress: () => void }) {
  return <TogglePill size="sm" label={activity.name} selected={selected} onPress={onPress} />;
}

/** Interest pills, wrapping. */
export function InterestPillWrap({
  items,
  selectedIds,
  onToggle,
}: {
  items: Activity[];
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
      {items.map((activity) => (
        <InterestPill key={activity.id} activity={activity} selected={selectedIds.includes(activity.id)} onPress={() => onToggle(activity.id)} />
      ))}
    </View>
  );
}
