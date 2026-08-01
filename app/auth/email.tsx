import { useState } from 'react';
import { Pressable, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { Title, Input, Button, BodyText } from '@/components/ui';
import { signIn, signUp } from '@/services/authService';
import { useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles, useTheme } from '@/theme';

export default function EmailAuthScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSignIn = mode === 'signin';
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { refreshSession } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const styles = useThemedStyles((t) => ({
    flex: { flex: 1, paddingTop: t.spacing.sm },
    back: { marginBottom: t.spacing.lg, alignSelf: 'flex-start' },
    linkWrap: { marginTop: t.spacing.lg },
    switchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: t.spacing.xl,
      alignItems: 'center',
    },
  }));

  const onSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isSignIn) {
        await signIn(email.trim(), password);
        await refreshSession();
      } else {
        await signUp(email.trim(), password);
        await refreshSession();
        router.replace(SCREENS.onboarding.index);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout scroll>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <BodyText style={{ color: theme.colors.accent, fontFamily: theme.typography.bodyStrong.fontFamily }}>
            ← Back
          </BodyText>
        </Pressable>

        <Title>{isSignIn ? t('auth.welcomeBackTitle') : t('auth.createAccountTitle')}</Title>

        <Input label={t('auth.email')} value={email} onChangeText={setEmail} placeholder="you@airline.com" />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={error || undefined}
        />

        <Button
          label={isSignIn ? t('auth.login') : t('auth.register')}
          onPress={onSubmit}
          loading={loading}
        />

        {isSignIn ? (
          <Link href={SCREENS.auth.forgotPassword} asChild>
            <Pressable style={styles.linkWrap}>
              <BodyText style={{ color: theme.colors.accent, fontFamily: theme.typography.bodyStrong.fontFamily }}>
                {t('auth.forgotPassword')}
              </BodyText>
            </Pressable>
          </Link>
        ) : null}

        <View style={styles.switchRow}>
          <BodyText muted>
            {isSignIn ? "Don't have an account? " : `${t('auth.alreadyHaveAccount')} `}
          </BodyText>
          <Pressable
            onPress={() => router.replace(SCREENS.auth.email(isSignIn ? 'signup' : 'signin'))}>
            <BodyText style={{ color: theme.colors.accent, fontFamily: theme.typography.bodyStrong.fontFamily }}>
              {isSignIn ? t('auth.signUpFree') : t('auth.login')}
            </BodyText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AuthScreenLayout>
  );
}
