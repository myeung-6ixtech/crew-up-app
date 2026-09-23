import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Button, BodyText } from '@/components/ui';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { formatApolloError } from '@/lib/graphqlError';
import { useAuth, useSession } from '@/hooks/useSession';
import { updateProfile } from '@/services/profileService';
import { useThemedStyles } from '@/theme';

export default function LanguageSettingsScreen() {
  const { t, i18n } = useTranslation();
  const client = useApolloClient();
  const { userId } = useAuth();
  const { refreshProfile } = useSession();
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? 'en';

  const styles = useThemedStyles((t) => ({
    scroll: {
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    error: {
      color: t.colors.statusOnDuty,
      marginTop: t.spacing.sm,
    },
  }));

  const onSelect = useCallback(
    async (code: string) => {
      if (code === currentLanguage || savingCode) return;

      setSavingCode(code);
      setError('');
      try {
        await i18n.changeLanguage(code);
        if (userId) {
          await updateProfile(client, userId, { preferred_language: code });
          await refreshProfile();
        }
      } catch (e) {
        setError(formatApolloError(e));
      } finally {
        setSavingCode(null);
      }
    },
    [client, currentLanguage, i18n, refreshProfile, savingCode, userId],
  );

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {SUPPORTED_LANGUAGES.map(({ code, labelKey }) => (
          <Button
            key={code}
            label={t(labelKey)}
            variant={currentLanguage === code ? 'primary' : 'secondary'}
            onPress={() => void onSelect(code)}
            loading={savingCode === code}
            disabled={Boolean(savingCode)}
            noTopMargin
          />
        ))}
        {error ? <BodyText style={styles.error}>{error}</BodyText> : null}
      </ScrollView>
    </Screen>
  );
}
