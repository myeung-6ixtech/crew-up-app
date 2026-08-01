import { memo, useMemo } from 'react';
import {
  Animated,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { getIconData, iconToSVG } from '@iconify/utils';
import { icons as uniconsLine } from '@iconify-json/uil';
import { icons as uniconsSolid } from '@iconify-json/uis';
import { SvgXml } from 'react-native-svg';
import { AppIcons, type AppIconName } from '@/components/icons/catalog';
import { TAB_BAR_HIT_SLOP } from '@/constants/tabBar';
import { useTheme } from '@/theme';

type TabBarIconButtonProps = {
  name: AppIconName;
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
  iconSize: number;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

function buildSvg(iconId: string, size: number, color: string, filled: boolean): string | null {
  const set = filled ? uniconsSolid : uniconsLine;
  const data = getIconData(set, iconId) ?? getIconData(uniconsLine, iconId);
  if (!data) return null;

  const { attributes, body } = iconToSVG(data, { width: size, height: size });
  const attrString = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  const coloredBody = body.replace(/currentColor/g, color);
  return `<svg ${attrString}>${coloredBody}</svg>`;
}

export const TabBarIconButton = memo(function TabBarIconButton({
  name,
  active,
  onPress,
  onLongPress,
  accessibilityLabel,
  iconSize,
  showBadge = false,
  style,
}: TabBarIconButtonProps) {
  const theme = useTheme();
  const iconId = AppIcons[name];
  const color = active ? theme.colors.accent : theme.colors.textTertiary;
  const xml = useMemo(
    () => buildSvg(iconId, iconSize, color, active),
    [iconId, iconSize, color, active],
  );

  const badgeSize = Math.max(6, Math.round(iconSize * 0.33));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={
        iconSize < TAB_BAR_HIT_SLOP
          ? {
              top: (TAB_BAR_HIT_SLOP - iconSize) / 2,
              bottom: (TAB_BAR_HIT_SLOP - iconSize) / 2,
              left: (TAB_BAR_HIT_SLOP - iconSize) / 2,
              right: (TAB_BAR_HIT_SLOP - iconSize) / 2,
            }
          : undefined
      }
      style={({ pressed }) => [
        {
          minWidth: TAB_BAR_HIT_SLOP,
          minHeight: TAB_BAR_HIT_SLOP,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.72 : 1,
        },
        style,
      ]}>
      {active ? (
        <View
          style={{
            backgroundColor: theme.colors.accentSubtle,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {xml ? <SvgXml xml={xml} width={iconSize} height={iconSize} /> : null}
        </View>
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {xml ? <SvgXml xml={xml} width={iconSize} height={iconSize} /> : null}
        </View>
      )}
      {showBadge ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: badgeSize,
            height: badgeSize,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.accent,
            borderWidth: 2,
            borderColor: theme.colors.bgSurfaceRaised,
          }}
        />
      ) : null}
    </Pressable>
  );
});
