import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { SCREENS } from '@/constants/screens';
import { DARK, DarkLimePill, DarkOutlinePill, TextPillAction } from '@/features/onboarding/components/kit';
import { useSession } from '@/hooks/useSession';
import { signInWithGoogle } from '@/services/authService';
import { fontFamily } from '@/theme';

/** Entry screen. Shares the dark ground with house rules: one lime primary, one outlined secondary, one text tertiary. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshSession } = useSession();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const onGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      await refreshSession();
    } catch (e) {
      const message = e instanceof Error ? e.message : t('common.error');
      if (!message.toLowerCase().includes('cancel')) {
        setError(message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: DARK.ground }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 16),
          paddingHorizontal: 28,
        }}>
        <View style={{ flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <Image
            source={require('@/assets/logos/crewup-wordmark-lime-2400.png')}
            accessibilityRole="image"
            accessibilityLabel={t('appName')}
            resizeMode="contain"
            style={{ width: 236, height: 67 }}
          />
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: fontFamily.jakartaBold,
              fontSize: 27,
              lineHeight: 30,
              letterSpacing: -0.7,
              color: DARK.ink,
              textAlign: 'center',
            }}>
            {t('auth.welcomeTitle')}
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.interRegular,
              fontSize: 14,
              lineHeight: 21,
              color: DARK.muted,
              textAlign: 'center',
              maxWidth: 280,
            }}>
            {t('auth.welcomeSubtitle')}
          </Text>
        </View>

        <View style={{ gap: 10, paddingTop: 16 }}>
          {error ? (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: '#FF5B60', textAlign: 'center' }}>{error}</Text>
          ) : null}
          <DarkLimePill label={t('auth.signUpFree')} onPress={() => router.push(SCREENS.auth.email('signup'))} />
          <DarkOutlinePill
            label={t('auth.continueWithGoogle')}
            icon={<GoogleIcon />}
            loading={googleLoading}
            onPress={() => void onGoogle()}
          />
          <TextPillAction label={t('auth.logIn')} color={DARK.ink} onPress={() => router.push(SCREENS.auth.email('signin'))} />
          <Text
            style={{
              fontFamily: fontFamily.interRegular,
              fontSize: 11,
              lineHeight: 16,
              color: DARK.faint,
              textAlign: 'center',
              paddingHorizontal: 12,
              paddingTop: 4,
            }}>
            {t('auth.termsNotice')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
