import { Pressable } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/ui';
import { useThemedStyles, useTheme } from '@/theme';

type TabHeaderIconButtonProps = {
  icon: AppIconName;
  onPress: () => void;
  accessibilityLabel: string;
  align?: 'left' | 'right';
};

/** Top-bar icon action — 44×44 hit target, matches tab header conventions. */
export function TabHeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  align = 'right',
}: TabHeaderIconButtonProps) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    hit: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: align === 'right' ? t.spacing.sm : 0,
      marginLeft: align === 'left' ? t.spacing.sm : 0,
    },
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.hit, { opacity: pressed ? 0.72 : 1 }]}>
      <AppIcon name={icon} size={24} color={theme.colors.accent} />
    </Pressable>
  );
}
