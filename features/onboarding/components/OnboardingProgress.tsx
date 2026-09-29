import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/theme';

/** Filled amount last shown, so the next step's bar slides from here. */
let shownProgress = 0;

export function resetOnboardingProgress() {
  shownProgress = 0;
}

/** Lime bar for profile steps 1–7. `current` is 1-based. */
export function OnboardingProgress({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(shownProgress)).current;

  useEffect(() => {
    const from = shownProgress;
    progress.setValue(from);
    shownProgress = current;
    Animated.timing(progress, {
      toValue: current,
      duration: theme.motion.base,
      useNativeDriver: false,
    }).start();
  }, [current, progress, theme.motion.base]);

  const width = progress.interpolate({
    inputRange: [0, total],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: current }}
      style={{ height: 4, backgroundColor: theme.colors.accentSubtle }}>
      <Animated.View style={{ width, height: '100%', backgroundColor: theme.colors.fill }} />
    </View>
  );
}
