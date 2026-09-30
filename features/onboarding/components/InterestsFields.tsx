import { useTranslation } from 'react-i18next';
import { BodyText, PillSelectorGroup } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Activity, ActivityKind } from '@/types/domain';

function optionsFor(activities: Activity[], kind: ActivityKind) {
  return activities
    .filter((activity) => (activity.kind ?? 'activity') === kind)
    .map((activity) => ({ value: activity.id, label: activity.name }));
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
  const theme = useTheme();
  if (loading) return <BodyText muted>{t('common.loading')}</BodyText>;

  return (
    <>
      <BodyText muted style={{ marginBottom: theme.spacing.lg }}>
        {t('onboarding.about.intoSubtitle')}
      </BodyText>
      <PillSelectorGroup
        label={t('onboarding.about.activities')}
        tone="fill"
        multiple
        values={selectedIds}
        onToggle={onToggle}
        options={optionsFor(activities, 'activity')}
      />
      <BodyText muted style={{ marginTop: -theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        {t('onboarding.about.activitiesHint')}
      </BodyText>
      <PillSelectorGroup
        label={t('onboarding.about.interests')}
        tone="fill"
        multiple
        values={selectedIds}
        onToggle={onToggle}
        options={optionsFor(activities, 'interest')}
      />
      <BodyText muted style={{ marginTop: -theme.spacing.xs }}>
        {t('onboarding.about.interestsHint')}
      </BodyText>
    </>
  );
}
