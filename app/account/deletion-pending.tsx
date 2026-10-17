import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ERROR_RED } from '@/components/auth/authKit';
import { Screen } from '@/components/ui';
import { PillCta, TextAction } from '@/features/onboarding/components/kit';
import { useSession } from '@/hooks/useSession';
import { FunctionError } from '@/lib/api/functions';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { formatDeletionDate, restoreAccount } from '@/services/accountService';
import { fontFamily, useTheme } from '@/theme';

/** Signed in during the 30-day grace period: keep the account, or sign out and let the deletion finish. */
export default function DeletionPendingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { pendingDeletion, refreshProfile, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const keep = async () => {
    setBusy(true);
    setError('');
    try {
      await restoreAccount();
      hapticSuccess();
      await refreshProfile();
    } catch (e) {
      hapticError();
      setError(e instanceof FunctionError && e.code === 'ACCOUNT_DELETE_EXPIRED' ? t('accountDelete.expired') : t('onboarding.genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ flex: 1, paddingTop: insets.top + 48, paddingHorizontal: 24, gap: 14 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 28, letterSpacing: -0.6, color: theme.colors.textPrimary }}>
          {t('accountDelete.pendingTitle')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 15, lineHeight: 23, color: theme.colors.textSecondary }}>
          {pendingDeletion ? t('accountDelete.pendingBody', { date: formatDeletionDate(pendingDeletion.purgeAfter) }) : ''}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textTertiary }}>
          {t('accountDelete.pendingNote')}
        </Text>
        {error ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: ERROR_RED }}>{error}</Text> : null}
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 14) + 10, gap: 6 }}>
        <PillCta label={t('accountDelete.keep')} loading={busy} onPress={() => void keep()} />
        <TextAction label={t('auth.signOut')} onPress={() => void signOut()} style={{ alignSelf: 'center' }} />
      </View>
    </Screen>
  );
}
