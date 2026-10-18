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

/** In-app browser as a sheet over the current screen, with Done (design 6F). */
function openSheet(url: string) {
  return WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: '#4F6E19',
    toolbarColor: '#F7F8F4',
    dismissButtonStyle: 'done',
    enableBarCollapsing: true,
  });
}

export function openPrivacyPolicy() {
  return openSheet(legal.privacyUrl);
}

export function openTerms() {
  return openSheet(legal.termsUrl);
}

export function openSupportEmail(subject = 'CrewUp support') {
  return Linking.openURL(`mailto:${legal.supportEmail}?subject=${encodeURIComponent(subject)}`);
}
