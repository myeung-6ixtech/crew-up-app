import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useTheme } from '@/theme';

/** Filled amount last shown, so the next step's bar slides from here. */
let shownProgress = 0;

export function resetOnboardingProgress() {
  shownProgress = 0;
}

/** Lime bar for the nine profile screens. `current` is 1-based. */
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
      duration: 400,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [current, progress]);

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
      style={{ height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: theme.colors.track }}>
      <Animated.View style={{ width, height: '100%', borderRadius: 2, backgroundColor: theme.colors.fill }} />
    </View>
  );
}
