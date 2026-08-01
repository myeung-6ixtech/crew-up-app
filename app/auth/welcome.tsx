import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthOutlineButton } from '@/components/auth/AuthOutlineButton';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { Button, DisplayText, Subtitle, AppIcon, BodyText } from '@/components/ui';
import { signInWithGoogle } from '@/services/authService';
import { useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles, useTheme } from '@/theme';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { refreshSession } = useSession();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      minHeight: 520,
      paddingTop: t.spacing.xl,
    },
    hero: { flex: 1, justifyContent: 'center' },
    logo: {
      width: 72,
      height: 72,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: t.spacing.xl,
    },
    logoText: { ...t.typography.bodyStrong, color: t.colors.textInverse, letterSpacing: 0.5 },
    actions: { paddingBottom: t.spacing.sm },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: t.spacing.xl },
    dividerLine: { flex: 1, height: 1, backgroundColor: t.colors.hairline },
    dividerText: { ...t.typography.body, color: t.colors.textSecondary, marginHorizontal: t.spacing.md },
    signInRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: t.spacing.sm,
      paddingVertical: t.spacing.sm,
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
          <View style={styles.logo}>
            <BodyText style={styles.logoText}>{t('appName')}</BodyText>
          </View>
          <DisplayText style={{ marginBottom: 8 }}>{t('auth.welcomeTitle')}</DisplayText>
          <Subtitle>{t('auth.welcomeSubtitle')}</Subtitle>
        </View>

        <View style={styles.actions}>
          {error ? <BodyText style={styles.error}>{error}</BodyText> : null}

          <Button label={t('auth.signUpFree')} onPress={goEmailSignup} />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <BodyText style={styles.dividerText}>{t('auth.or')}</BodyText>
            <View style={styles.dividerLine} />
          </View>

          <AuthOutlineButton
            label={t('auth.continueWithEmail')}
            onPress={goEmailSignup}
            icon={<AppIcon name="email" size={20} color={theme.colors.textPrimary} />}
          />
          <AuthOutlineButton
            label={t('auth.continueWithGoogle')}
            onPress={onGoogle}
            loading={googleLoading}
            icon={<GoogleIcon />}
          />

          <Pressable onPress={() => router.push(SCREENS.auth.email('signin'))} style={styles.signInRow}>
            <BodyText muted>{t('auth.alreadyHaveAccount')} </BodyText>
            <BodyText style={{ color: theme.colors.accent, fontFamily: theme.typography.bodyStrong.fontFamily }}>
              {t('auth.login')}
            </BodyText>
          </Pressable>
        </View>
      </View>
    </AuthScreenLayout>
  );
}
