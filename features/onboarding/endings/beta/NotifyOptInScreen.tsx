import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { SCREENS } from '@/constants/screens';
import { useSession } from '@/hooks/useSession';
import { registerForPushNotifications } from '@/services/notificationService';
import { fontFamily, useTheme } from '@/theme';
import { MonoLabel, PillCta, StepTitle, TextPillAction } from '../../components/kit';
import { completeBetaSignup, OnboardingRequestError } from '../../services/onboardingService';

export function BellGlyph({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 10a6 6 0 0112 0v4l1.6 2.6a.6.6 0 01-.5.9H4.9a.6.6 0 01-.5-.9L6 14z" fill={color} />
      <Path d="M9.5 19.5a2.5 2.5 0 005 0" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** Beta ending 1: a sample of the single launch notification, then Notify me or Skip. Both join the list. */
export function NotifyOptInScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useSession();
  const [saving, setSaving] = useState<'notify' | 'skip' | null>(null);
  const [error, setError] = useState('');

  const finish = async (requestPermission: boolean) => {
    setSaving(requestPermission ? 'notify' : 'skip');
    setError('');
    try {
      if (requestPermission) await registerForPushNotifications();
      await completeBetaSignup();
      await refreshProfile();
      router.replace(SCREENS.onboarding.betaHolding);
    } catch (e) {
      if (e instanceof OnboardingRequestError && e.code === 'ONBOARDING_PROFILE_INCOMPLETE') {
        router.replace(SCREENS.onboarding.step('review'));
        return;
      }
      setError(e instanceof OnboardingRequestError ? e.message : t('onboarding.genericError'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 22,
          paddingTop: insets.top + 24,
          paddingHorizontal: 24,
          paddingBottom: 24,
        }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: theme.colors.fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <BellGlyph color={theme.colors.onFill} />
        </View>
        <StepTitle style={{ textAlign: 'center' }}>{t('onboarding.betaNotify.title')}</StepTitle>
        <Text
          style={{
            fontFamily: fontFamily.interRegular,
            fontSize: 14.5,
            lineHeight: 21,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            maxWidth: 290,
          }}>
          {t('onboarding.betaNotify.subtitle')}
        </Text>
        <View
          accessible
          accessibilityLabel={t('onboarding.betaNotify.sampleBody')}
          style={{
            alignSelf: 'stretch',
            backgroundColor: theme.colors.card,
            borderRadius: 20,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            gap: 12,
            marginTop: 6,
            shadowColor: '#0E1113',
            shadowOpacity: 0.07,
            shadowRadius: 15,
            shadowOffset: { width: 0, height: 10 },
            elevation: 3,
          }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: '#0E1113',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: '#A8E05F' }}>Cu</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.textPrimary }}>{t('appName')}</Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 11.5, color: theme.colors.textTertiary }}>
                {t('onboarding.betaNotify.sampleTime')}
              </Text>
            </View>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 18, color: theme.colors.textSecondary }}>
              {t('onboarding.betaNotify.sampleBody')}
            </Text>
          </View>
        </View>
        <MonoLabel style={{ fontSize: 10, color: theme.colors.textTertiary }}>{t('onboarding.betaNotify.onlyOne')}</MonoLabel>
        {error ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, textAlign: 'center' }}>{error}</Text>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16), gap: 10 }}>
        <PillCta
          label={t('onboarding.betaNotify.enable')}
          onPress={() => void finish(true)}
          loading={saving === 'notify'}
          disabled={saving === 'skip'}
        />
        <TextPillAction label={t('onboarding.betaNotify.skip')} onPress={() => (saving ? undefined : void finish(false))} />
      </View>
    </View>
  );
}
