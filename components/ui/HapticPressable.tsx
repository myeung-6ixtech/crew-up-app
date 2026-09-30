import { Pressable, type PressableProps } from 'react-native';
import { hapticImpact, hapticSelection, hapticWarning } from '@/lib/haptics';

type HapticKind = 'light' | 'selection' | 'warning' | 'none';

/** Pressable that ticks on press. Disabled presses stay silent. */
export function HapticPressable({
  haptic = 'light',
  disabled,
  onPress,
  ...rest
}: PressableProps & { haptic?: HapticKind }) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPress={(event) => {
        if (!disabled && haptic !== 'none') {
          if (haptic === 'selection') hapticSelection();
          else if (haptic === 'warning') hapticWarning();
          else hapticImpact();
        }
        onPress?.(event);
      }}
    />
  );
}
