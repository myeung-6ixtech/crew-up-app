import { requireOptionalNativeModule } from 'expo';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ScanFrameGlyph } from '@/components/crew/qrGlyphs';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { fontFamily } from '@/theme';

/**
 * The camera is a native module, so it's only loaded when this build has it. Expo Router loads every screen at
 * start-up: importing the camera directly would crash an older build (or one updated over the air) without it.
 */
const ScannerScreen: (() => React.JSX.Element) | null = requireOptionalNativeModule('ExpoCamera')
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/features/crewQr/ScannerScreen').ScannerScreen
  : null;

/** Crew QR scanner (features/crewQr/ScannerScreen.tsx), or a calm "update the app" screen without the camera module. */
export default function ScanCrewQrRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useScreenInsets();
  if (ScannerScreen) return <ScannerScreen />;
  return (
    <View style={{ flex: 1, backgroundColor: '#0E1113', paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <ScanFrameGlyph color="#A8E05F" size={40} />
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, color: '#EDF1F2', textAlign: 'center' }}>
          {t('friends.scanNeedsUpdateTitle')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 21, color: '#A7B1B5', textAlign: 'center', maxWidth: 300 }}>
          {t('friends.scanNeedsUpdateBody')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={({ pressed }) => ({ height: 52, borderRadius: 26, backgroundColor: '#A8E05F', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: '#0E1113' }}>{t('common.close')}</Text>
      </Pressable>
    </View>
  );
}
