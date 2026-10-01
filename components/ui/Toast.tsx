import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, useThemedStyles, useTheme } from '@/theme';

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
  const translateY = useRef(new Animated.Value(16)).current;
  const styles = useThemedStyles((t) => ({
    wrap: {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: insets.bottom + 96,
      zIndex: 100,
    },
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#0E1113',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: '#0E1113',
      shadowOpacity: 0.25,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.fill },
    text: {
      flex: 1,
      fontFamily: fontFamily.interMedium,
      fontSize: 14,
      lineHeight: 19,
      color: '#EDF1F2',
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
          toValue: 16,
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
      <View style={styles.bubble} accessibilityLiveRegion="polite">
        <View style={styles.dot} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}
