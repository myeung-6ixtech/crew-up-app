import { Linking, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SettingsPage } from '@/components/settings/settingsKit';
import { fontFamily, useTheme } from '@/theme';

const EMERGENCY_NUMBERS_URL = 'https://en.wikipedia.org/wiki/List_of_emergency_telephone_numbers';

type TipSection = { title: string; body: string };

export default function SafetyTipsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const sections = t('safety.tips.sections', { returnObjects: true }) as TipSection[];
  return (
    <SettingsPage title={t('safety.tips.title')} subtitle={t('safety.tips.lead')}>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 16, gap: 16 }}>
        {sections.map((section) => (
          <View key={section.title} style={{ gap: 4 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
              {section.title}
            </Text>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textSecondary }}>{section.body}</Text>
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 16, gap: 8 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.statusOnDuty }}>
          {t('safety.tips.emergencyTitle')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textSecondary }}>
          {t('safety.tips.emergencyBody')}
        </Text>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => void Linking.openURL(EMERGENCY_NUMBERS_URL)}>
          <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14.5, color: theme.colors.accentText }}>{t('safety.tips.emergencyLink')}</Text>
        </Pressable>
      </View>
    </SettingsPage>
  );
}
