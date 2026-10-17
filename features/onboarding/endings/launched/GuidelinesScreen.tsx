import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LegalNotice } from '@/components/legal/LegalNotice';
import { AppIcon, BodyText, HeadlineText } from '@/components/ui';
import { fontFamily, useTheme } from '@/theme';
import { BulletList } from '../../components/BulletList';
import { StepScaffold } from '../../components/StepScaffold';
import { useStepSave } from '../../hooks/useStepForm';

/** Launch ending 2: explicit guidelines acceptance (recorded server-side at completion). */
export function GuidelinesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [accepted, setAccepted] = useState(false);
  const { save, saving, formError } = useStepSave('launch_guidelines', 'flow');
  const points = t('onboarding.guidelines.points', { returnObjects: true }) as string[];

  return (
    <StepScaffold
      step="launch_guidelines"
      context="flow"
      title={t('onboarding.guidelines.title')}
      primaryLabel={t('onboarding.guidelines.cta')}
      onPrimary={() => void save({})}
      primaryLoading={saving}
      primaryDisabled={!accepted}
      error={formError}>
      <HeadlineText style={{ marginBottom: theme.spacing.md }}>{t('onboarding.guidelines.lead')}</HeadlineText>
      <BulletList items={points} />
      <BodyText style={{ marginTop: theme.spacing.md, fontFamily: fontFamily.interMedium }}>{t('onboarding.guidelines.zeroTolerance')}</BodyText>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => setAccepted((value) => !value)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
        <AppIcon
          name={accepted ? 'checkboxOn' : 'checkboxOff'}
          size={24}
          color={accepted ? theme.colors.accentText : theme.colors.textTertiary}
        />
        <View style={{ flex: 1 }}>
          <LegalNotice
            i18nKey="onboarding.guidelines.acceptWithTerms"
            linkColor={theme.colors.accentText}
            style={{ fontFamily: fontFamily.interRegular, fontSize: 15, lineHeight: 22, color: theme.colors.textPrimary }}
          />
        </View>
      </Pressable>
    </StepScaffold>
  );
}
