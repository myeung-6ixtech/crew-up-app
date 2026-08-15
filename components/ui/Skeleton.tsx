import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
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
    const animation = Animated.loop(
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
    return () => animation.stop();
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
