import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BodyText, Subtitle, Title } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { useTheme } from '@/theme';
import { StepScaffold } from '../components/StepScaffold';
import { resetOnboardingProgress } from '../components/OnboardingProgress';
import { useHouseRulesStore } from '../houseRulesStore';

type HouseRule = { title: string; body: string };

/** Welcome shown once before step 1. Agreement stays on the device. */
export function HouseRulesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { userId } = useAuth();
  const accept = useHouseRulesStore((state) => state.accept);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const rules = t('onboarding.houseRules.rules', { returnObjects: true }) as HouseRule[];

  useEffect(() => {
    resetOnboardingProgress();
  }, []);

  return (
    <StepScaffold
      context="flow"
      hideLeading
      primaryLabel={t('onboarding.houseRules.cta')}
      primaryLoading={saving}
      onPrimary={() => {
        if (!userId) return;
        setSaving(true);
        setError(undefined);
        void accept(userId)
          .catch(() => {
            setSaving(false);
            setError(t('onboarding.genericError'));
          });
      }}
      error={error}>
      <Image
        source={require('@/assets/logos/crewup-wordmark-lime-2400.png')}
        accessibilityRole="image"
        accessibilityLabel={t('appName')}
        resizeMode="contain"
        style={{ width: 176, height: 50, alignSelf: 'center', marginBottom: 20 }}
      />
      <Title style={{ textAlign: 'center', marginBottom: 20 }}>{t('onboarding.houseRules.title')}</Title>
      <Subtitle style={{ textAlign: 'center', marginBottom: 50 }}>
        {t('onboarding.houseRules.subtitle')}
      </Subtitle>
      <View style={{ alignSelf: 'center', width: '100%', paddingHorizontal: 20 }}>
        {Array.isArray(rules)
          ? rules.map((rule, index) => (
              <View key={rule.title} style={{ marginBottom: index === rules.length - 1 ? 0 : 35 }}>
                <BodyText strong style={{ textAlign: 'left', marginBottom: 2 }}>
                  {`${index + 1}.  ${rule.title}`}
                </BodyText>
                <BodyText style={{ textAlign: 'left', color: theme.colors.textSecondary }}>{rule.body}</BodyText>
              </View>
            ))
          : null}
      </View>
    </StepScaffold>
  );
}
