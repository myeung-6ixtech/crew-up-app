import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthPage, CenterNotice, ClockGlyph, ERROR_RED, FieldStatus, PasswordChecklist, PasswordField, QuietAction, useShowPassword } from '@/components/auth/authKit';
import { SCREENS } from '@/constants/screens';
import { PillCta, StepSubtitle, StepTitle } from '@/features/onboarding/components/kit';
import { useAuth, useSession } from '@/hooks/useSession';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { passwordRules, passwordScore, personalTokens } from '@/lib/password';
import { authErrorCode, changePassword, exchangeRefreshToken } from '@/services/authService';
import { fontFamily, useTheme } from '@/theme';

/**
 * 4L — the reset link (crewup://auth/reset?refreshToken=…) signs the user in, so there is no back button and
 * no old password. Saves via change password, then the guard lands them on Home. A bad link shows 4F's notice.
 */
export default function SetNewPasswordScreen() {
  const params = useLocalSearchParams<{ refreshToken?: string; error?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { refreshSession } = useSession();
  const { isAuthenticated, user, profile } = useAuth();
  const [state, setState] = useState<'working' | 'ready' | 'expired'>('working');
  const { shown, toggle } = useShowPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (params.refreshToken) {
      exchangeRefreshToken(params.refreshToken)
        .then(async () => {
          await refreshSession();
          setState('ready');
        })
        .catch(() => setState('expired'));
      return;
    }
    setState(isAuthenticated && !params.error ? 'ready' : 'expired');
  }, [isAuthenticated, params.error, params.refreshToken, refreshSession]);

  const email = user?.email ?? '';
  const personal = useMemo(
    () => personalTokens(email, profile?.full_name, profile?.preferred_name),
    [email, profile?.full_name, profile?.preferred_name],
  );
  const rules = useMemo(() => passwordRules(password, personal), [password, personal]);
  const score = passwordScore(password, rules);
  const match = confirm.length > 0 && confirm === password;
  const mismatch = confirm.length > 0 && !password.startsWith(confirm);
  const ready = score === 4 && match;

  const save = async () => {
    if (!ready) return;
    setSaving(true);
    setError('');
    try {
      await changePassword(password);
      hapticSuccess();
      router.replace(SCREENS.tabs.home);
    } catch (e) {
      hapticError();
      setError(authErrorCode(e) === 'password-in-hibp-database' ? t('auth.passwordBreached') : e instanceof Error && e.message ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (state === 'working') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bgCanvas }}>
        <ActivityIndicator color={theme.colors.textSecondary} />
      </View>
    );
  }

  if (state === 'expired') {
    return (
      <AuthPage
        centered
        footer={
          <>
            <PillCta label={t('auth.sendNewLink')} onPress={() => router.replace(SCREENS.auth.forgotPassword())} />
            <QuietAction label={t('auth.backToLogin')} onPress={() => router.replace(SCREENS.auth.login())} />
          </>
        }>
        <CenterNotice tone="field" icon={<ClockGlyph />} title={t('auth.expiredTitle')}>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 290 }}>
            {t('auth.resetExpiredBody')}
          </Text>
        </CenterNotice>
      </AuthPage>
    );
  }

  return (
    <AuthPage footer={<PillCta label={t('auth.saveAndContinue')} disabled={!ready} loading={saving} onPress={() => void save()} />}>
      <StepTitle>{t('auth.newPasswordTitle')}</StepTitle>
      {email ? <StepSubtitle>{t('auth.forEmail', { email })}</StepSubtitle> : null}
      <View style={{ marginTop: 22 }}>
        <PasswordField isNew autoFocus label={t('auth.newPassword')} value={password} onChangeText={setPassword} shown={shown} onToggle={toggle} />
        <PasswordChecklist rules={rules} score={score} personalLabel={t('auth.rules.personal')} />
        <View style={{ marginTop: 18 }}>
          <PasswordField
            isNew
            label={t('auth.confirmNewPassword')}
            placeholder={t('auth.typeItAgain')}
            value={confirm}
            onChangeText={setConfirm}
            shown={shown}
            error={mismatch ? ' ' : undefined}
            trailing={<FieldStatus label={match ? t('auth.match') : mismatch ? t('auth.noMatch') : ''} tone={match ? 'ok' : 'bad'} />}
            returnKeyType="done"
            onSubmitEditing={() => void save()}
          />
        </View>
        {error ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, lineHeight: 19, color: ERROR_RED, paddingLeft: 4 }}>{error}</Text> : null}
      </View>
    </AuthPage>
  );
}
