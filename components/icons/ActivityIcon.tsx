import { useMemo } from 'react';
import { Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ACTIVITY_ICONS } from '@/constants/activityIcons';
import { fontFamily } from '@/theme';

/**
 * An activity's monoline icon (48×48, stroke currentColor, 2.2 width, round caps and joins), from the design's set
 * via `npm run icons:activities`. A slug without an icon falls back to the catalogue's emoji or the name's first letters.
 */
export function ActivityIcon({
  slug,
  name,
  fallback,
  size = 32,
  color,
}: {
  slug?: string | null;
  name: string;
  /** The catalogue's `icon` text (an emoji), used when there's no drawn icon. */
  fallback?: string | null;
  size?: number;
  color: string;
}) {
  const markup = slug ? ACTIVITY_ICONS[slug] : undefined;
  const xml = useMemo(
    () =>
      markup
        ? `<svg viewBox="0 0 48 48" fill="none" stroke="${color}" color="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${markup.replace(/currentColor/g, color)}</svg>`
        : null,
    [color, markup],
  );
  if (xml) return <SvgXml xml={xml} width={size} height={size} accessibilityElementsHidden importantForAccessibility="no" />;
  return (
    <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontFamily: fontFamily.jakartaBold, fontSize: Math.round(size * 0.62), color }}>
      {fallback?.trim() || name.slice(0, 2)}
    </Text>
  );
}
