import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BodyText } from '@/components/ui';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { Activity, ActivityKind } from '@/types/domain';
import { CheckBadge, MonoLabel, TogglePill } from './kit';

function ofKind(activities: Activity[], kind: ActivityKind) {
  return activities.filter((activity) => (activity.kind ?? 'activity') === kind);
}

/** Bubble glyph: the catalog's emoji icon when it has one, otherwise the first two letters. */
function glyphOf(activity: Activity) {
  return activity.icon?.trim() || activity.name.slice(0, 2);
}

function ActivityBubble({ activity, selected, onPress }: { activity: Activity; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
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
        <Text
          style={{
            fontFamily: fontFamily.jakartaBold,
            fontSize: 20,
            color: selected ? theme.colors.onFill : theme.colors.textTertiary,
          }}>
          {glyphOf(activity)}
        </Text>
        {selected ? (
          <View style={{ position: 'absolute', top: -2, right: -2 }}>
            <CheckBadge ring={theme.colors.ground} />
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 12, color: theme.colors.textPrimary }}>
        {activity.name}
      </Text>
    </Pressable>
  );
}

export function InterestsFields({
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
  if (loading) return <BodyText muted>{t('common.loading')}</BodyText>;

  return (
    <>
      <MonoLabel>{t('onboarding.about.activitiesLabel')}</MonoLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, marginTop: 12, marginHorizontal: -4 }}>
        {ofKind(activities, 'activity').map((activity) => (
          <ActivityBubble
            key={activity.id}
            activity={activity}
            selected={selectedIds.includes(activity.id)}
            onPress={() => onToggle(activity.id)}
          />
        ))}
      </View>
      <MonoLabel style={{ marginTop: 22 }}>{t('onboarding.about.interestsLabel')}</MonoLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {ofKind(activities, 'interest').map((activity) => (
          <TogglePill
            key={activity.id}
            size="sm"
            label={activity.name}
            selected={selectedIds.includes(activity.id)}
            onPress={() => onToggle(activity.id)}
          />
        ))}
      </View>
    </>
  );
}
