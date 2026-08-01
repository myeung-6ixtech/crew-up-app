import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles, useTheme } from '@/theme';

export function Toast({
  message,
  visible,
  onHide,
  durationMs = 2400,
}: {
  message: string;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const styles = useThemedStyles((t) => ({
    wrap: {
      position: 'absolute',
      left: t.spacing.lg,
      right: t.spacing.lg,
      top: insets.top + t.spacing.lg,
      zIndex: 100,
      alignItems: 'center',
    },
    bubble: {
      backgroundColor: t.colors.textPrimary,
      borderRadius: t.radius.cta,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      maxWidth: '100%',
    },
    text: {
      ...t.typography.bodyStrong,
      color: t.colors.textInverse,
      textAlign: 'center',
    },
  }));

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: theme.motion.fast,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: theme.motion.fast,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: theme.motion.fast,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -16,
          duration: theme.motion.fast,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible, opacity, translateY, theme.motion.fast]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onHide]);

  if (!rendered) return null;

  return (
    <Animated.View
      style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none">
      <View style={styles.bubble}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}
