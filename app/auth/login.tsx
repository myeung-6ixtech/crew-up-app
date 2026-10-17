import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthPage, ERROR_RED, InlineLink, MailGlyph, OrDivider, OutlinePill, PasswordField, useShowPassword } from '@/components/auth/authKit';
import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { SCREENS } from '@/constants/screens';
import { FilledField, PillCta, StepTitle } from '@/features/onboarding/components/kit';
import { useSession } from '@/hooks/useSession';
import { hapticError } from '@/lib/haptics';
import { authErrorCode, sendVerificationEmail, signIn, signInWithGoogle } from '@/services/authService';
import { useAuthDraftStore } from '@/stores/authDraftStore';
import { fontFamily, useTheme } from '@/theme';

type Problem = null | 'unverified' | 'invalid' | 'other';

/**
 * 4G log in, 4H the credentials worked but the email isn't verified (not an error — one step left),
 * and 4I one message for a wrong email or password so accounts can't be probed.
 */
export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { refreshSession } = useSession();
  const draftEmail = useAuthDraftStore((state) => state.email);
  const setEmailDraft = useAuthDraftStore((state) => state.setEmail);
  const clearDraft = useAuthDraftStore((state) => state.clear);
  const [email, setEmail] = useState(params.email ?? draftEmail);
  const [password, setPassword] = useState('');
  const { shown, toggle } = useShowPassword();
  const [problem, setProblem] = useState<Problem>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const trimmed = email.trim();
  const canSubmit = trimmed.length > 0 && password.length > 0;

  const logIn = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await signIn(trimmed, password);
      clearDraft();
      setProblem(null);
      // useAuthGuard routes on to onboarding or Home once the session lands.
      await refreshSession();
    } catch (e) {
      hapticError();
      const code = authErrorCode(e);
      if (code === 'unverified-user') setProblem('unverified');
      else if (code === 'invalid-email-password') setProblem('invalid');
      else {
        setProblem('other');
        setMessage(e instanceof Error && e.message ? e.message : t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const sendNewLink = async () => {
    setSending(true);
    try {
      await sendVerificationEmail(trimmed);
      useAuthDraftStore.getState().setCredentials(trimmed, password);
      router.push(SCREENS.auth.checkInbox('verify'));
    } catch (e) {
      if (authErrorCode(e) === 'email-already-verified') {
        setProblem(null);
        void logIn();
      } else {
        setProblem('other');
        setMessage(e instanceof Error && e.message ? e.message : t('common.error'));
      }
    } finally {
      setSending(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await refreshSession();
    } catch (e) {
      const text = e instanceof Error ? e.message : t('common.error');
      if (!text.toLowerCase().includes('cancel')) {
        setProblem('other');
        setMessage(text);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const forgot = () => {
    setEmailDraft(trimmed);
    router.push(SCREENS.auth.forgotPassword(trimmed || undefined));
  };

  const edited = () => {
    if (problem) setProblem(null);
  };

  const unverified = problem === 'unverified';

  return (
    <AuthPage
      onBack={() => (router.canGoBack() ? router.back() : router.replace(SCREENS.auth.welcome))}
      footer={
        unverified ? (
          <OutlinePill label={t('auth.verifiedLogIn')} loading={loading} onPress={() => void logIn()} />
        ) : (
          <>
            <PillCta label={problem === 'invalid' ? t('auth.tryAgain') : t('auth.logIn')} disabled={!canSubmit} loading={loading} onPress={() => void logIn()} />
            {problem !== 'invalid' ? (
              <>
                <OrDivider />
                <AppleSignInButton
                  variant={theme.mode === 'dark' ? 'white' : 'black'}
                  onError={(text) => {
                    setProblem('other');
                    setMessage(text || t('common.error'));
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={googleLoading}
                  onPress={() => void onGoogle()}
                  style={({ pressed }) => ({
                    height: 56,
                    borderRadius: 28,
                    borderWidth: 1.5,
                    borderColor: pressed ? theme.colors.ink : '#D4D8CD',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: googleLoading ? 0.6 : 1,
                  })}>
                  <View style={{ position: 'absolute', left: 22 }}>
                    <GoogleIcon />
                  </View>
                  <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>{t('auth.continueWithGoogle')}</Text>
                </Pressable>
                <View style={{ alignItems: 'center', paddingTop: 4 }}>
                  <InlineLink lead={t('auth.newToCrewUp')} label={t('auth.signUpFree')} onPress={() => router.replace(SCREENS.auth.signUp)} />
                </View>
              </>
            ) : null}
          </>
        )
      }>
      <StepTitle>{t('auth.welcomeBackTitle')}</StepTitle>

      {unverified ? (
        <View style={{ marginTop: 24, borderRadius: 16, backgroundColor: '#0E1113', padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#A8E05F', alignItems: 'center', justifyContent: 'center' }}>
              <MailGlyph size={18} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: '#EDF1F2' }}>{t('auth.verifyFirstTitle')}</Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 19, color: '#A7B1B5' }}>{t('auth.verifyFirstBody', { email: trimmed })}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={sending}
            onPress={() => void sendNewLink()}
            style={({ pressed }) => ({ height: 44, borderRadius: 22, backgroundColor: pressed ? '#B8EA74' : '#A8E05F', alignItems: 'center', justifyContent: 'center', opacity: sending ? 0.6 : 1 })}>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14.5, color: '#0E1113' }}>{t('auth.sendNewLink')}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ marginTop: unverified ? 16 : 28 }}>
        <FilledField
          label={t('auth.email')}
          value={email}
          onChangeText={(value) => {
            setEmail(value.replace(/\s/g, ''));
            edited();
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          autoFocus={!email}
          returnKeyType="next"
        />
        <PasswordField
          label={t('auth.password')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            edited();
          }}
          shown={shown}
          onToggle={toggle}
          autoFocus={Boolean(email)}
          error={problem === 'invalid' ? t('auth.invalidCredentials') : undefined}
          returnKeyType="go"
          onSubmitEditing={() => void logIn()}
        />
        {problem === 'other' && message ? (
          <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, lineHeight: 19, color: ERROR_RED, paddingLeft: 4 }}>{message}</Text>
        ) : null}
        {!unverified ? (
          <Pressable accessibilityRole="button" onPress={forgot} hitSlop={8} style={{ alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 }}>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>{t('auth.forgotPassword')}</Text>
          </Pressable>
        ) : null}
      </View>
    </AuthPage>
  );
}
