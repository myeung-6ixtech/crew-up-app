import { Pressable, Text, View } from 'react-native';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

/**
 * Two or more equal segments in a rounded track (Your trips: Trips / Layovers). The selected segment is ink with
 * light text. Announced as a tab list, with the selected tab stated.
 */
export function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  const dark = theme.mode === 'dark';
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', height: 40, padding: 3, borderRadius: 14, backgroundColor: dark ? theme.colors.field : '#E3E6DD' }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              hapticSelection();
              onChange(option.value);
            }}
            style={{ flex: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? theme.colors.ink : 'transparent' }}>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: selected ? theme.colors.ground : theme.colors.textPrimary }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
