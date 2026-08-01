import { memo, useMemo } from 'react';
import { View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getIconData, iconToSVG } from '@iconify/utils';
import { icons as uniconsSet } from '@iconify-json/uil';
import { lightColors } from '@/theme/tokens';
import { AppIcons, type AppIconName, type UniconsIconId } from './catalog';

export type { AppIconName, UniconsIconId };

type IconColor = ColorValue;

type AppIconProps = {
  /** Semantic name from {@link AppIcons}. */
  name: AppIconName;
  size?: number;
  color?: IconColor;
  style?: StyleProp<ViewStyle>;
};

type UniconsIconProps = {
  /** Raw Unicons id, e.g. `home`. */
  icon: UniconsIconId | (string & {});
  size?: number;
  color?: IconColor;
  style?: StyleProp<ViewStyle>;
};

function buildSvgMarkup(iconId: string, size: number, color: IconColor): string | null {
  const data = getIconData(uniconsSet, iconId);
  if (!data) return null;

  const { attributes, body } = iconToSVG(data, { width: size, height: size });
  const attrString = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  const coloredBody = body.replace(/currentColor/g, String(color));

  return `<svg ${attrString}>${coloredBody}</svg>`;
}

function IconBase({
  iconId,
  size = 24,
  color = lightColors.textPrimary,
  style,
}: {
  iconId: string;
  size?: number;
  color?: IconColor;
  style?: StyleProp<ViewStyle>;
}) {
  const xml = useMemo(() => buildSvgMarkup(iconId, size, color), [iconId, size, color]);
  if (!xml) return null;

  return (
    <View style={style}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

/** Standard app icon — Unicons via Iconify. Prefer semantic `name` over raw ids. */
export const AppIcon = memo(function AppIcon({ name, size, color, style }: AppIconProps) {
  return <IconBase iconId={AppIcons[name]} size={size} color={color} style={style} />;
});

/** Escape hatch for a Unicons id not yet in {@link AppIcons}. */
export const UniconsIcon = memo(function UniconsIcon({ icon, size, color, style }: UniconsIconProps) {
  return <IconBase iconId={icon} size={size} color={color} style={style} />;
});
