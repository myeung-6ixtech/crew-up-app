import { Text, type TextStyle } from 'react-native';
import { Trans } from 'react-i18next';
import { openPrivacyPolicy, openTerms } from '@/lib/legal';

/** A sentence whose `<terms>` and `<privacy>` tags open the Terms of Use and Privacy Policy in the in-app browser. */
export function LegalNotice({ i18nKey, style, linkColor }: { i18nKey: string; style: TextStyle; linkColor: string }) {
  const link: TextStyle = { color: linkColor, textDecorationLine: 'underline' };
  return (
    <Text style={style}>
      <Trans
        i18nKey={i18nKey}
        components={{
          terms: <Text accessibilityRole="link" style={link} onPress={() => void openTerms()} />,
          privacy: <Text accessibilityRole="link" style={link} onPress={() => void openPrivacyPolicy()} />,
        }}
      />
    </Text>
  );
}
