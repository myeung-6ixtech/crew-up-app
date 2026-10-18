import Constants from 'expo-constants';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SettingsPage, SettingsRow, SettingsSection } from '@/components/settings/settingsKit';
import { SCREENS } from '@/constants/screens';
import { legal, openPrivacyPolicy, openSupportEmail, openTerms } from '@/lib/legal';
import { fontFamily, useTheme } from '@/theme';

/** Hosts shown under each legal row, e.g. crewup.app/privacy. */
function shortUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * 6E — version, legal and support. Privacy Policy and Terms open the in-app browser sheet (6F);
 * licences are the generated list; Support opens the mail app.
 */
export default function AboutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version;
  const build = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode?.toString();

  return (
    <SettingsPage title={t('settings.about')}>
      <SettingsSection>
        {version ? <SettingsRow label={t('settings.version')} sub={build ? `${version} (${build})` : version} minHeight={66} /> : null}
        <SettingsRow label={t('about.privacyPolicy')} sub={shortUrl(legal.privacyUrl)} onPress={() => void openPrivacyPolicy()} minHeight={66} />
        <SettingsRow label={t('about.licenses')} sub={t('settings.licensesSub')} onPress={() => router.push(SCREENS.legal.licenses)} minHeight={66} />
        <SettingsRow label={t('about.terms')} sub={shortUrl(legal.termsUrl)} onPress={() => void openTerms()} minHeight={66} />
        <SettingsRow label={t('settings.support')} sub={legal.supportEmail} trail="external" onPress={() => void openSupportEmail()} minHeight={66} />
      </SettingsSection>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, lineHeight: 18, color: theme.colors.textSecondary }}>{t('about.notAffiliated')}</Text>
    </SettingsPage>
  );
}
