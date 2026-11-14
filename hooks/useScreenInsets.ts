import { Platform } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

/** 3-button Android navigation bar. Edge-to-edge often reports a bottom inset of 0. */
const ANDROID_NAV_BAR = 48;

/**
 * Same as `useSafeAreaInsets`, except a missing Android bottom inset is treated as the
 * system navigation bar. iOS and a reported Android inset are left unchanged.
 */
export function useScreenInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'android' || insets.bottom > 0) return insets;
  return { ...insets, bottom: ANDROID_NAV_BAR };
}
