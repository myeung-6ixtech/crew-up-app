import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

type LegalConfig = { privacyUrl: string; termsUrl: string; supportEmail: string; deletionUrl: string };

/** Store-listed links, set in app.json `extra.legal`. The same URLs go into App Store Connect and Play Console. */
export const legal: LegalConfig = (Constants.expoConfig?.extra as { legal?: LegalConfig } | undefined)?.legal ?? {
  privacyUrl: 'https://crewup.app/privacy',
  termsUrl: 'https://crewup.app/terms',
  supportEmail: 'support@crewup.app',
  deletionUrl: 'https://crewup.app/delete-account',
};

export function openPrivacyPolicy() {
  return WebBrowser.openBrowserAsync(legal.privacyUrl);
}

export function openTerms() {
  return WebBrowser.openBrowserAsync(legal.termsUrl);
}

export function openSupportEmail(subject = 'CrewUp support') {
  return Linking.openURL(`mailto:${legal.supportEmail}?subject=${encodeURIComponent(subject)}`);
}
