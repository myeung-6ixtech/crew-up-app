import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ERROR_RED, PasswordField, useShowPassword } from '@/components/auth/authKit';
import { SettingsPage } from '@/components/settings/settingsKit';
import { FilledField } from '@/features/onboarding/components/kit';
import { useSession } from '@/hooks/useSession';
import { FunctionError } from '@/lib/api/functions';
import { hapticError, hapticWarning } from '@/lib/haptics';
import { DELETE_CONFIRM_WORD, fetchDeletionInfo, formatDeletionDate, requestAccountDeletion } from '@/services/accountService';
import { fontFamily, useTheme } from '@/theme';

/**
 * Delete account (Apple 5.1.1(v)). Type DELETE, plus the password for email accounts.
 * The account is hidden and signed out now and erased after 30 days; signing in before then offers to keep it.
 */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { signOut } = useSession();
  const { shown, toggle } = useShowPassword();
  const [requiresPassword, setRequiresPassword] = useState<boolean | null>(null);
  const [graceDays, setGraceDays] = useState(30);
  const [confirm, setConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeletionInfo()
      .then((info) => {
        setRequiresPassword(info.requiresPassword);
        setGraceDays(info.graceDays);
      })
      .catch(() => setError(t('accountDelete.loadFailed')));
  }, [t]);

  const ready = confirm.trim() === DELETE_CONFIRM_WORD && (requiresPassword === false || password.length > 0) && requiresPassword !== null;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      const { purgeAfter } = await requestAccountDeletion(requiresPassword ? password : undefined);
      hapticWarning();
      Alert.alert(t('accountDelete.doneTitle'), t('accountDelete.doneBody', { date: formatDeletionDate(purgeAfter) }), [
        { text: t('common.close'), onPress: () => void signOut() },
      ]);
    } catch (e) {
      hapticError();
      const code = e instanceof FunctionError ? e.code : '';
      setError(
        code === 'ACCOUNT_DELETE_BAD_PASSWORD'
          ? t('accountDelete.badPassword')
          : code === 'UNAUTHORIZED'
            ? t('accountDelete.signInAgain')
            : t('onboarding.genericError'),
      );
    } finally {
      setBusy(false);
    }
  };

  const points = t('accountDelete.points', { returnObjects: true, days: graceDays }) as string[];

  return (
    <SettingsPage
      title={t('accountDelete.title')}
      subtitle={t('accountDelete.intro', { days: graceDays })}
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready, busy }}
          disabled={!ready || busy}
          onPress={() => void submit()}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 28,
            backgroundColor: ready ? ERROR_RED : theme.colors.track,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: ready ? '#FFFFFF' : theme.colors.textTertiary }}>
              {t('accountDelete.cta')}
            </Text>
          )}
        </Pressable>
      }>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 16, gap: 8 }}>
        {points.map((point) => (
          <View key={point} style={{ flexDirection: 'row', gap: 10 }}>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textSecondary }}>•</Text>
            <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>{point}</Text>
          </View>
        ))}
      </View>
      {requiresPassword === null && !error ? <ActivityIndicator color={theme.colors.accentText} /> : null}
      {requiresPassword ? (
        <PasswordField label={t('accountDelete.password')} value={password} onChangeText={setPassword} shown={shown} onToggle={toggle} />
      ) : null}
      <FilledField
        label={t('accountDelete.typeToConfirm', { word: DELETE_CONFIRM_WORD })}
        value={confirm}
        onChangeText={setConfirm}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={DELETE_CONFIRM_WORD}
      />
      {error ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, lineHeight: 19, color: ERROR_RED, paddingLeft: 4 }}>{error}</Text> : null}
    </SettingsPage>
  );
}
