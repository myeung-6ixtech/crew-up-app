import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ERROR_RED, FieldStatus, PasswordChecklist, PasswordField, useShowPassword } from '@/components/auth/authKit';
import { SettingsPage } from '@/components/settings/settingsKit';
import { PillCta } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { passwordRules, passwordScore, personalTokens } from '@/lib/password';
import { authErrorCode, changePassword } from '@/services/authService';
import { fontFamily, useTheme } from '@/theme';

/**
 * 3F — password only: the same rules, meter and confirm field as sign up (4B) and reset (4L).
 * Change password unlocks once every rule passes and both fields match. No 2FA, sessions or delete account.
 */
export default function AccountSecurityScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, profile } = useAuth();
  const { shown, toggle } = useShowPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const personal = useMemo(
    () => personalTokens(user?.email, profile?.full_name, profile?.preferred_name),
    [profile?.full_name, profile?.preferred_name, user?.email],
  );
  const rules = useMemo(() => passwordRules(password, personal), [password, personal]);
  const score = passwordScore(password, rules);
  const match = confirm.length > 0 && confirm === password;
  const mismatch = confirm.length > 0 && !password.startsWith(confirm);
  const ready = score === 4 && match;

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setDone(false);
    setError('');
  };

  const onSubmit = async () => {
    if (!ready) return;
    setSaving(true);
    setError('');
    try {
      await changePassword(password);
      hapticSuccess();
      setPassword('');
      setConfirm('');
      setDone(true);
    } catch (e) {
      hapticError();
      setError(authErrorCode(e) === 'password-in-hibp-database' ? t('auth.passwordBreached') : e instanceof Error && e.message ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPage
      title={t('menu.accountSecurity')}
      subtitle={t('security.intro')}
      footer={
        <>
          {done ? (
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.accentText, textAlign: 'center' }}>
              {t('security.changed')}
            </Text>
          ) : null}
          <PillCta label={done ? t('security.changedButton') : t('security.change')} disabled={!ready && !done} loading={saving} onPress={() => void onSubmit()} />
        </>
      }>
      <View>
        <PasswordField isNew label={t('auth.newPassword')} value={password} onChangeText={edit(setPassword)} shown={shown} onToggle={toggle} />
        <PasswordChecklist rules={rules} score={score} personalLabel={t('auth.rules.personal')} />
        <View style={{ marginTop: 18 }}>
          <PasswordField
            isNew
            label={t('auth.confirmNewPassword')}
            placeholder={t('auth.typeItAgain')}
            value={confirm}
            onChangeText={edit(setConfirm)}
            shown={shown}
            error={mismatch ? ' ' : undefined}
            trailing={<FieldStatus label={match ? t('auth.match') : mismatch ? t('auth.noMatch') : ''} tone={match ? 'ok' : 'bad'} />}
            returnKeyType="done"
            onSubmitEditing={() => void onSubmit()}
          />
        </View>
        {error ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, lineHeight: 19, color: ERROR_RED, paddingLeft: 4 }}>{error}</Text> : null}
      </View>
    </SettingsPage>
  );
}
