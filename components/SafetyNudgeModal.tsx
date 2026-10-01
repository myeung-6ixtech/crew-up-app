import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui';
import { PillCta } from '@/features/onboarding/components/kit';
import { fontFamily, useTheme } from '@/theme';

function ShieldGlyph({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.4-7.5 9.5-4.4-1.1-7.5-4.9-7.5-9.5V6z" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Path d="M8.8 12.2l2.2 2.2 4.4-4.6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** First open of Messages each session: a short safety note. Dismissing hides it for the session. */
export function SafetyNudgeModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onDismiss}>
      <View style={{ gap: 14, paddingHorizontal: 8, paddingBottom: 4 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.fill,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 10,
          }}>
          <ShieldGlyph color={theme.colors.onFill} />
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 24, letterSpacing: -0.5, color: theme.colors.textPrimary }}>
          {t('safety.nudgeTitle')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textSecondary }}>
          {t('safety.nudgeBody')}
        </Text>
        <View style={{ marginTop: 6 }}>
          <PillCta label={t('safety.gotIt')} onPress={onDismiss} />
        </View>
      </View>
    </BottomSheet>
  );
}
