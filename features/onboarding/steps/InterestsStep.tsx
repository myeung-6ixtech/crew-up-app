import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityPickerField } from '@/components/events/ActivityPickerField';
import { BodyText } from '@/components/ui';
import { hapticError } from '@/lib/haptics';
import { useAuth } from '@/hooks/useSession';
import { fontFamily, useTheme } from '@/theme';
import { MonoLabel } from '../components/kit';
import { StepScaffold } from '../components/StepScaffold';
import { useActivitySelection } from '../hooks/useActivitySelection';

/**
 * Edit profile → What are you into? The same two fields as Create meetup, each opening the search sheet with the
 * full catalogue. Your activities (what's saved now) lead the Activities sheet.
 */
export function InterestsStep() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { userId } = useAuth();
  const interests = useActivitySelection(userId);
  const [error, setError] = useState('');
  const { activities, interestRows } = useMemo(
    () => ({
      activities: interests.activities.filter((item) => (item.kind ?? 'activity') === 'activity'),
      interestRows: interests.activities.filter((item) => item.kind === 'interest'),
    }),
    [interests.activities],
  );

  const onSave = async () => {
    setError('');
    try {
      await interests.save();
      router.back();
    } catch {
      hapticError();
      setError(t('onboarding.genericError'));
    }
  };

  return (
    <StepScaffold
      context="edit"
      title={t('onboarding.about.intoTitle')}
      primaryLabel={t('onboarding.save')}
      onPrimary={() => void onSave()}
      primaryLoading={interests.saving}
      primaryDisabled={interests.loading || interests.failed}
      error={error || (interests.failed ? t('onboarding.genericError') : '')}>
      {interests.loading ? (
        <BodyText muted>{t('common.loading')}</BodyText>
      ) : (
        <View>
          <MonoLabel>{t('events.activitiesTitle')}</MonoLabel>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 4 }}>
            {t('onboarding.about.activitiesSubtitle')}
          </Text>
          <ActivityPickerField
            kind="activity"
            items={activities}
            mineIds={interests.savedIds}
            selectedIds={interests.selectedIds}
            onChange={interests.setSelectedIds}
          />
          <MonoLabel style={{ marginTop: 24 }}>{t('events.interestsTitle')}</MonoLabel>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 4 }}>
            {t('onboarding.about.interestsSubtitle')}
          </Text>
          <ActivityPickerField kind="interest" items={interestRows} selectedIds={interests.selectedIds} onChange={interests.setSelectedIds} />
        </View>
      )}
    </StepScaffold>
  );
}
