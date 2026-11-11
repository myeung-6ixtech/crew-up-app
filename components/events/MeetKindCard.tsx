import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { LockGlyph } from '@/components/events/pin';
import type { EventMeetType } from '@/constants/events';
import { fontFamily, useTheme } from '@/theme';

function GlobeGlyph({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

/** The choice from "What kind of meet?", shown at the top of the form with Change (6C). */
export function MeetKindCard({ kind, onChange }: { kind: EventMeetType; onChange: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const priv = kind === 'private';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: theme.colors.card, marginTop: 16 }}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: '#A8E05F', alignItems: 'center', justifyContent: 'center' }}>
        {priv ? <LockGlyph color="#0E1113" size={16} /> : <GlobeGlyph color="#0E1113" />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: theme.colors.textPrimary }}>{priv ? t('events.privateMeet') : t('events.publicMeet')}</Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 17, color: theme.colors.textSecondary }}>
          {priv ? t('events.kindPrivateSub') : t('events.kindPublicSub')}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('events.changeKind')} onPress={onChange} hitSlop={10}>
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.accentText }}>{t('events.change')}</Text>
      </Pressable>
    </View>
  );
}

/** Under Where on a private meet: guests see the venue and notes only after the PIN. */
export function PrivateHiddenNote() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
      <LockGlyph color={theme.colors.textSecondary} size={11} />
      <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 12, lineHeight: 17, color: theme.colors.textSecondary }}>{t('events.privateHiddenNote')}</Text>
    </View>
  );
}
