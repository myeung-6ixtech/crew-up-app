import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RadioRow, SettingsPage, SettingsSection } from '@/components/settings/settingsKit';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatApolloError } from '@/lib/graphqlError';
import { useAuth, useSession } from '@/hooks/useSession';
import { updateProfile } from '@/services/profileService';
import { fontFamily, useTheme } from '@/theme';

/** Shown greyed with SOON until a `locales/<code>/` bundle ships; each in its own name first. */
const COMING_SOON = [
  { code: 'zh-Hant', native: '繁體中文', english: 'Chinese (Traditional)' },
  { code: 'zh-Hans', native: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'ko', native: '한국어', english: 'Korean' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'fr', native: 'Français', english: 'French' },
];

function SoonTag() {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontFamily: fontFamily.monoMedium,
        fontSize: 10,
        letterSpacing: 0.6,
        color: theme.colors.textTertiary,
        backgroundColor: theme.colors.field,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 9,
        overflow: 'hidden',
      }}>
      SOON
    </Text>
  );
}

/** 3D — opened from the menu's Language row. Only shipped locales can be picked. */
export default function LanguageSettingsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const client = useApolloClient();
  const { userId } = useAuth();
  const { refreshProfile } = useSession();
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const current = i18n.resolvedLanguage ?? i18n.language ?? 'en';

  const onSelect = useCallback(
    async (code: string) => {
      if (code === current || savingCode) return;
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
    [client, current, i18n, refreshProfile, savingCode, userId],
  );

  return (
    <SettingsPage title={t('menu.language')} subtitle={t('menu.languageIntro')}>
      <View>
        <SettingsSection>
          {SUPPORTED_LANGUAGES.map(({ code, labelKey }) => (
            <RadioRow
              key={code}
              minHeight={64}
              label={t(labelKey)}
              selected={current === code}
              disabled={Boolean(savingCode)}
              onPress={() => void onSelect(code)}
              trailing={savingCode === code ? <ActivityIndicator color={theme.colors.textSecondary} /> : undefined}
            />
          ))}
          {COMING_SOON.map((language, index) => (
            <RadioRow
              key={language.code}
              minHeight={64}
              label={language.native}
              detail={language.english}
              selected={false}
              disabled
              last={index === COMING_SOON.length - 1}
              trailing={<SoonTag />}
            />
          ))}
        </SettingsSection>
        {error ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, marginTop: 12 }}>{error}</Text> : null}
      </View>
    </SettingsPage>
  );
}
