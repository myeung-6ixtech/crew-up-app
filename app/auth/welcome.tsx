import { useState } from 'react';
import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthOutlineButton } from '@/components/auth/AuthOutlineButton';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { Button, DisplayText, Subtitle, BodyText } from '@/components/ui';
import { signInWithGoogle } from '@/services/authService';
import { useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles } from '@/theme';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshSession } = useSession();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 520,
    },
    hero: {
      alignItems: 'center',
      paddingHorizontal: t.spacing.xl,
    },
    wordmark: {
      width: 252,
      height: 72,
      marginBottom: 20,
    },
    actions: {
      marginTop: 24,
      paddingBottom: t.spacing.sm,
      gap: t.spacing.sm,
    },
    error: { ...t.typography.body, color: t.colors.statusOnDuty, marginBottom: t.spacing.sm, textAlign: 'center' },
  }));

  const goEmailSignup = () => router.push(SCREENS.auth.email('signup'));

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
    <AuthScreenLayout scroll>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={require('@/assets/logos/crewup-wordmark-lime-2400.png')}
            accessibilityRole="image"
            accessibilityLabel={t('appName')}
            resizeMode="contain"
            style={styles.wordmark}
          />
          <DisplayText style={{ marginBottom: 8, textAlign: 'center', fontSize: 20, lineHeight: 28 }}>
            {t('auth.welcomeTitle')}
          </DisplayText>
          <Subtitle style={{ textAlign: 'center', marginBottom: 0 }}>{t('auth.welcomeSubtitle')}</Subtitle>
        </View>

        <View style={styles.actions}>
          {error ? <BodyText style={styles.error}>{error}</BodyText> : null}

          <Button label={t('auth.signUpFree')} onPress={goEmailSignup} noTopMargin />
          <AuthOutlineButton
            label={t('auth.continueWithGoogle')}
            onPress={onGoogle}
            loading={googleLoading}
            icon={<GoogleIcon />}
          />
          <Button
            label={t('auth.logIn')}
            onPress={() => router.push(SCREENS.auth.email('signin'))}
            variant="secondary"
            noTopMargin
          />
        </View>
      </View>
    </AuthScreenLayout>
  );
}
