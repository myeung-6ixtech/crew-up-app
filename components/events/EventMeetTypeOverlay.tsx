import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { RowChevron } from '@/components/crew/kit';
import { BottomSheet } from '@/components/ui';
import type { EventMeetType } from '@/constants/events';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { hapticImpact } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

type EventMeetTypeOverlayProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: EventMeetType) => void;
};

function GlobeGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function LockGlyph({ color }: { color: string }) {
  return (
    <Svg width={20} height={22} viewBox="0 0 16 18">
      <Rect x={2} y={8} width={12} height={9} rx={2} fill={color} />
      <Path d="M5 8V5.5a3 3 0 016 0V8" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

/** What kind of meet? Choosing opens the create form with that visibility filled in; closing stays put. */
export function EventMeetTypeOverlay({ visible, onClose, onSelect }: EventMeetTypeOverlayProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const options: { value: EventMeetType; title: string; body: string; note: string; icon: React.ReactNode }[] = [
    {
      value: 'public',
      title: t('events.publicMeet'),
      body: t('events.publicMeetBody'),
      note: t('events.publicMeetNote'),
      icon: <GlobeGlyph color={theme.colors.onFill} />,
    },
    {
      value: 'private',
      title: t('events.privateMeet'),
      body: t('events.privateMeetBody'),
      note: t('events.privateMeetNote'),
      icon: <LockGlyph color={theme.colors.onFill} />,
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 6 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 24, letterSpacing: -0.5, color: theme.colors.textPrimary }}>
            {t('events.meetTypeTitle')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            onPress={onClose}
            hitSlop={8}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={10} height={10} viewBox="0 0 10 10">
              <Path d="M1 1l8 8M9 1L1 9" stroke={theme.colors.textPrimary} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${option.title}. ${option.body}`}
            onPress={() => {
              hapticImpact();
              onClose();
              onSelect(option.value);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              borderRadius: 18,
              backgroundColor: pressed ? theme.colors.field : theme.colors.ground,
            })}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }}>
              {option.icon}
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>{option.title}</Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary }}>{option.body}</Text>
              <MonoLabel style={{ fontSize: 10, color: theme.colors.accentText, marginTop: 2 }}>{option.note}</MonoLabel>
            </View>
            <RowChevron color={theme.colors.textTertiary} />
          </Pressable>
        ))}
        <View style={{ height: 8 }} />
      </View>
    </BottomSheet>
  );
}
