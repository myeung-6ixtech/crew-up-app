import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, View, type ViewStyle } from 'react-native';
import { useThemedStyles } from '@/theme';

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  const styles = useThemedStyles((t) => ({
    block: {
      backgroundColor: t.colors.hairline,
    },
  }));

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    // Reduce Motion: a still grey block.
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

      animation.start();
    });
    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}
