import { Alert, ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OutlineButton, SettingsRow, SettingsSection, SettingsTopBar, VersionStamp } from '@/components/settings/settingsKit';
import { SCREENS } from '@/constants/screens';
import { useAuth, useSession } from '@/hooks/useSession';
import { hapticWarning } from '@/lib/haptics';
import { useTheme, useThemeControls } from '@/theme';

const appVersion = Constants.expoConfig?.version;

/** 6C — everything configurable, grouped Account / App / Support, with Sign out at the foot. */
export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preference } = useThemeControls();
  const { profile } = useAuth();
  const { signOut } = useSession();

  const language = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  const visibility = profile?.default_visibility ?? 'friends';
  const privacySub =
    visibility === 'off' ? t('settings.privacyHidden') : t('settings.privacyVisibleTo', { audience: t(`privacy.audience.${visibility}`).toLowerCase() });

  const confirmSignOut = () => {
    Alert.alert(t('menu.signOutTitle'), t('menu.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: () => {
          hapticWarning();
          void signOut();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas, paddingTop: insets.top }}>
      <SettingsTopBar title={t('menu.settings')} />
      <ScrollView contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 14) + 26, gap: 20 }}>
        <SettingsSection label={t('settings.groupAccount')}>
          <SettingsRow icon="account" label={t('settings.account')} sub={t('settings.accountSub')} onPress={() => router.push(SCREENS.settings.account)} />
          <SettingsRow icon="privacy" label={t('menu.privacy')} sub={privacySub} onPress={() => router.push(SCREENS.profile.privacy)} />
        </SettingsSection>
        <SettingsSection label={t('settings.groupApp')}>
          <SettingsRow
            icon="appearance"
            label={t('settings.appearance')}
            sub={t('settings.appearanceSub')}
            value={t(`settings.theme.${preference}`)}
            onPress={() => router.push(SCREENS.settings.appearance)}
          />
          <SettingsRow
            icon="language"
            label={t('menu.language')}
            sub={t('settings.languageSub')}
            value={t(`settings.languages.${language}`, { defaultValue: language.toUpperCase() })}
            onPress={() => router.push(SCREENS.profile.language)}
          />
        </SettingsSection>
        <SettingsSection label={t('settings.groupSupport')}>
          <SettingsRow icon="about" label={t('settings.about')} sub={t('settings.aboutSub')} onPress={() => router.push(SCREENS.settings.about)} />
        </SettingsSection>
        <View style={{ marginTop: 8, gap: 16 }}>
          <OutlineButton
            label={t('auth.signOut')}
            onPress={confirmSignOut}
            icon={
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path d="M14 4h3.5A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5H14M10 16l-4-4 4-4M6 12h10" stroke={theme.colors.textPrimary} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
          />
          <VersionStamp version={appVersion} center />
        </View>
      </ScrollView>
    </View>
  );
}
