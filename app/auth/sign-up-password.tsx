import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthPage, ERROR_RED, FieldStatus, PasswordChecklist, PasswordField, useShowPassword } from '@/components/auth/authKit';
import { LegalNotice } from '@/components/legal/LegalNotice';
import { SCREENS } from '@/constants/screens';
import { PillCta, StepSubtitle, StepTitle } from '@/features/onboarding/components/kit';
import { useSession } from '@/hooks/useSession';
import { hapticError } from '@/lib/haptics';
import { passwordRules, passwordScore, personalTokens } from '@/lib/password';
import { authErrorCode, signUp } from '@/services/authService';
import { useAuthDraftStore } from '@/stores/authDraftStore';
import { fontFamily, useTheme } from '@/theme';

/** 4B — the rules tick live; Create account unlocks once every rule passes and Confirm matches. */
export default function SignUpPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { refreshSession } = useSession();
  const email = useAuthDraftStore((state) => state.email.trim());
  const setCredentials = useAuthDraftStore((state) => state.setCredentials);
  const markTaken = useAuthDraftStore((state) => state.markTaken);
  const { shown, toggle } = useShowPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rules = useMemo(() => passwordRules(password, personalTokens(email)), [email, password]);
  const score = passwordScore(password, rules);
  const match = confirm.length > 0 && confirm === password;
  const mismatch = confirm.length > 0 && !password.startsWith(confirm);
  const ready = score === 4 && match;

  if (!email) return <Redirect href={SCREENS.auth.signUp} />;

  const create = async () => {
    if (!ready) return;
    setLoading(true);
    setError('');
    try {
      const { verify } = await signUp(email, password);
      if (!verify) {
        // Verification is off on this backend: there is already a session, and the guard takes over.
        await refreshSession();
        return;
      }
      setCredentials(email, password);
      router.replace(SCREENS.auth.checkInbox('verify'));
    } catch (e) {
      hapticError();
      const code = authErrorCode(e);
      if (code === 'user-already-exists' || code === 'email-already-in-use') {
        markTaken(email);
        router.back();
        return;
      }
      setError(
        code === 'password-in-hibp-database'
          ? t('auth.passwordBreached')
          : code === 'password-too-short'
            ? t('auth.rules.length')
            : e instanceof Error && e.message
              ? e.message
              : t('common.error'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage
      onBack={() => router.back()}
      footer={
        <>
          <LegalNotice
            i18nKey="auth.agreeOnCreate"
            linkColor={theme.colors.accentText}
            style={{ fontFamily: fontFamily.interRegular, fontSize: 11.5, lineHeight: 17, color: theme.colors.textTertiary, textAlign: 'center' }}
          />
          <PillCta label={t('auth.register')} disabled={!ready} loading={loading} onPress={() => void create()} />
        </>
      }>
      <StepTitle>{t('auth.passwordTitle')}</StepTitle>
      <StepSubtitle>{t('auth.forEmail', { email })}</StepSubtitle>
      <View style={{ marginTop: 22 }}>
        <PasswordField
          isNew
          autoFocus
          label={t('auth.password')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
          }}
          shown={shown}
          onToggle={toggle}
        />
        <PasswordChecklist rules={rules} score={score} personalLabel={t('auth.rules.personalEmail')} />
        <View style={{ marginTop: 18 }}>
          <PasswordField
            isNew
            label={t('auth.confirmPassword')}
            placeholder={t('auth.typeItAgain')}
            value={confirm}
            onChangeText={setConfirm}
            shown={shown}
            error={mismatch ? ' ' : undefined}
            trailing={<FieldStatus label={match ? t('auth.match') : mismatch ? t('auth.noMatch') : ''} tone={match ? 'ok' : 'bad'} />}
            returnKeyType="done"
            onSubmitEditing={() => void create()}
          />
        </View>
        {error ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, lineHeight: 19, color: ERROR_RED, paddingLeft: 4 }}>{error}</Text> : null}
      </View>
    </AuthPage>
  );
}
