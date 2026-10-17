import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LegalNotice } from '@/components/legal/LegalNotice';
import { SettingsPage } from '@/components/settings/settingsKit';
import { fontFamily, useTheme } from '@/theme';

/** The same guidelines people agree to in onboarding, readable any time from the menu. */
export default function GuidelinesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const points = t('onboarding.guidelines.points', { returnObjects: true }) as string[];
  return (
    <SettingsPage title={t('onboarding.guidelines.title')} subtitle={t('onboarding.guidelines.lead')}>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 16, gap: 12 }}>
        {points.map((point) => (
          <View key={point} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.accentText, marginTop: 8 }} />
            <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textPrimary }}>{point}</Text>
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, lineHeight: 21, color: theme.colors.textPrimary }}>
        {t('onboarding.guidelines.zeroTolerance')}
      </Text>
      <LegalNotice
        i18nKey="about.guidelinesTerms"
        linkColor={theme.colors.accentText}
        style={{ fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 20, color: theme.colors.textSecondary }}
      />
    </SettingsPage>
  );
}
