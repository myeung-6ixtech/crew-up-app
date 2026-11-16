import { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { onboardingActivityGroups, onboardingInterestGroups } from '@crewup/shared';
import { ActivityBubbleGrid, InterestPillWrap } from '@/components/activities/ActivityChoice';
import { BodyText } from '@/components/ui';
import type { Activity } from '@/types/domain';
import { MonoLabel } from './kit';

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
          <ActivityBubbleGrid items={group.items} selectedIds={selectedIds} onToggle={onToggle} />
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
          <InterestPillWrap items={group.items} selectedIds={selectedIds} onToggle={onToggle} />
        </View>
      ))}
    </>
  );
}
