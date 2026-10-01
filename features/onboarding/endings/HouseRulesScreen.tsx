import { useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { darkColors, fontFamily } from '@/theme';
import { resetOnboardingProgress } from '../components/OnboardingProgress';
import { useConfirmSignOut } from '../components/StepScaffold';
import { useHouseRulesStore } from '../houseRulesStore';

type HouseRule = { title: string; body: string };

const RULE_BORDER = '#23282B';
const RULE_BODY = '#A7B1B5';
const CTA_PRESSED = '#B8EA74';

/** Shown once before step 1, agreement stored on the device. The only dark screen — a curtain-up before the light flow. */
export function HouseRulesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const accept = useHouseRulesStore((state) => state.accept);
  const confirmSignOut = useConfirmSignOut();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const rules = t('onboarding.houseRules.rules', { returnObjects: true }) as HouseRule[];

  useEffect(() => {
    resetOnboardingProgress();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        confirmSignOut();
        return true;
      });
      return () => subscription.remove();
    }, [confirmSignOut]),
  );

  const onAgree = () => {
    if (!userId) return;
    setSaving(true);
    setError(undefined);
    void accept(userId).catch(() => {
      setSaving(false);
      setError(t('onboarding.genericError'));
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: darkColors.ground }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 72, paddingHorizontal: 24, paddingBottom: 24 }}>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: fontFamily.jakartaBold, fontSize: 32, lineHeight: 34, letterSpacing: -0.8, color: darkColors.ink }}>
          {t('onboarding.houseRules.title')}
        </Text>
        <View style={{ marginTop: 32, borderBottomWidth: 1, borderBottomColor: RULE_BORDER }}>
          {Array.isArray(rules)
            ? rules.map((rule, index) => (
                <View
                  key={rule.title}
                  style={{ flexDirection: 'row', gap: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: RULE_BORDER }}>
                  <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 12, color: darkColors.fill, paddingTop: 3 }}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: darkColors.ink }}>{rule.title}</Text>
                    <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: RULE_BODY }}>
                      {rule.body}
                    </Text>
                  </View>
                </View>
              ))
            : null}
        </View>
        {error ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: darkColors.statusOnDuty, marginTop: 16 }}>
            {error}
          </Text>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16) }}>
        <HapticPressable
          accessibilityRole="button"
          accessibilityState={{ busy: saving }}
          disabled={saving}
          onPress={onAgree}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 28,
            backgroundColor: pressed ? CTA_PRESSED : darkColors.fill,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: saving ? 0.7 : 1,
          })}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: darkColors.onFill }}>
            {t('onboarding.houseRules.cta')}
          </Text>
        </HapticPressable>
      </View>
    </View>
  );
}
