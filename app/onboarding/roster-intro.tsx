import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlowFooter } from '@/components/roster/flowKit';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { useRosterDraftStore } from '@/stores/rosterDraftStore';
import { fontFamily, useTheme } from '@/theme';

/** An illustration of what a roster gives CrewUp: coarse city windows, nothing else. */
const SAMPLE_WINDOWS = [
  { code: 'BKK', left: 0.3, width: 0.28, days: [3, 4] },
  { code: 'HKG', left: 0.42, width: 0.22, days: [8, 9] },
  { code: 'NRT', left: 0.12, width: 0.34, days: [14, 15] },
];

/** First launch after onboarding: upload a roster, type layovers, or skip for now. */
export default function RosterIntroScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const clearDraft = useRosterDraftStore((state) => state.clear);
  const month = new Date().toLocaleDateString(undefined, { month: 'short' });

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: 16 }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ backgroundColor: '#0E1113', borderRadius: 24, paddingVertical: 22, paddingHorizontal: 20, gap: 14 }}>
          <MonoLabel style={{ fontSize: 10.5, color: '#7D878B' }}>
            {t('rosterFlow.introCardLabel', { month: new Date().toLocaleDateString(undefined, { month: 'long' }) })}
          </MonoLabel>
          <View style={{ gap: 10 }}>
            {SAMPLE_WINDOWS.map((row) => (
              <View key={row.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ width: 40, fontFamily: fontFamily.jakartaBold, fontSize: 15, color: '#EDF1F2' }}>{row.code}</Text>
                <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#2C3134' }}>
                  <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${row.left * 100}%`, width: `${row.width * 100}%`, borderRadius: 4, backgroundColor: '#A8E05F' }} />
                </View>
                <Text style={{ width: 62, textAlign: 'right', fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: '#A7B1B5' }}>
                  {`${row.days[0]}–${row.days[1]} ${month}`}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: '#A7B1B5' }}>{t('rosterFlow.introCardNote')}</Text>
        </View>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: fontFamily.jakartaBold, fontSize: 32, lineHeight: 35, letterSpacing: -0.8, color: theme.colors.textPrimary, marginTop: 32 }}>
          {t('onboarding.rosterIntro.title')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary, marginTop: 12 }}>
          {t('onboarding.rosterIntro.subtitle')}
        </Text>
      </ScrollView>
      <FlowFooter
        bottomInset={insets.bottom}
        primary={{ label: t('roster.upload'), onPress: () => router.push(SCREENS.roster.upload) }}
        secondary={{
          label: t('roster.manual'),
          onPress: () => {
            clearDraft();
            router.push(SCREENS.roster.confirm);
          },
        }}
        tertiary={{ label: t('onboarding.rosterIntro.later'), onPress: () => router.replace(SCREENS.tabs.home) }}
      />
    </Screen>
  );
}
