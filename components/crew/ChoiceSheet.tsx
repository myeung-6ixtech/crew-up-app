import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { RowChevron } from '@/components/crew/kit';
import { BottomSheet } from '@/components/ui';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { hapticImpact } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

export type ChoiceSheetOption<T extends string> = {
  value: T;
  title: string;
  body: string;
  /** Mono note under the body, e.g. VISIBLE TO VERIFIED CREW. */
  note?: string;
  icon: ReactNode;
};

/** Short bottom sheet: big title with a close button, then one tinted card per choice. Closing stays put. */
export function ChoiceSheet<T extends string>({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: ChoiceSheetOption<T>[];
  onClose: () => void;
  onSelect: (value: T) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 6 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 24, letterSpacing: -0.5, color: theme.colors.textPrimary }}>
            {title}
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
              {option.note ? <MonoLabel style={{ fontSize: 10, color: theme.colors.accentText, marginTop: 2 }}>{option.note}</MonoLabel> : null}
            </View>
            <RowChevron color={theme.colors.textTertiary} />
          </Pressable>
        ))}
        <View style={{ height: 8 }} />
      </View>
    </BottomSheet>
  );
}
