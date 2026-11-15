import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { onboardingActivityGroups, onboardingInterestGroups } from '@crewup/shared';
import { ActivityIcon } from '@/components/icons/ActivityIcon';
import { BodyText } from '@/components/ui';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { Activity } from '@/types/domain';
import { CheckBadge, MonoLabel, TogglePill } from './kit';

function ActivityBubble({ activity, selected, onPress }: { activity: Activity; selected: boolean; onPress: () => void }) {
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

/** Onboarding step 1 (5 of 9): the short flagged set as bubbles, under Drinks, Sports & fitness and Events. */
export function OnboardingActivityFields({
  activities,
  selectedIds,
  onToggle,
  loading,
}: {
  activities: Activity[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const groups = useMemo(() => onboardingActivityGroups(activities), [activities]);
  if (loading) return <BodyText muted>{t('common.loading')}</BodyText>;

  return (
    <>
      {groups.map((group, index) => (
        <View key={group.key} style={{ marginTop: index === 0 ? 0 : 22 }}>
          <MonoLabel>{group.label}</MonoLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginTop: 12, marginHorizontal: -4 }}>
            {group.items.map((activity) => (
              <ActivityBubble
                key={activity.id}
                activity={activity}
                selected={selectedIds.includes(activity.id)}
                onPress={() => onToggle(activity.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

/** Onboarding step 2: every interest as a small pill, under its group. Groups without interests are left out. */
export function OnboardingInterestFields({
  activities,
  selectedIds,
  onToggle,
  loading,
}: {
  activities: Activity[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const groups = useMemo(() => onboardingInterestGroups(activities), [activities]);
  if (loading) return <BodyText muted>{t('common.loading')}</BodyText>;

  return (
    <>
      {groups.map((group, index) => (
        <View key={group.key} style={{ marginTop: index === 0 ? 0 : 20 }}>
          <MonoLabel>{group.label}</MonoLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {group.items.map((activity) => (
              <TogglePill
                key={activity.id}
                size="sm"
                label={activity.name}
                selected={selectedIds.includes(activity.id)}
                onPress={() => onToggle(activity.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}
