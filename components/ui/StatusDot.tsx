import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useThemedStyles, useTheme } from '@/theme';

export type CrewStatus = 'available' | 'onDuty' | 'layover' | 'verified';

const statusLabels: Record<CrewStatus, string> = {
  available: 'Available',
  onDuty: 'On duty',
  layover: 'Layover',
  verified: 'Verified crew',
};

export function StatusDot({
  status,
  size = 8,
  compact = false,
  pulseKey,
}: {
  status: CrewStatus;
  size?: number;
  compact?: boolean;
  pulseKey?: string | number;
}) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const styles = useThemedStyles((t) => ({
    dot: {
      width: size,
      height: size,
      borderRadius: t.radius.pill,
      backgroundColor:
        status === 'available'
          ? t.colors.statusAvailable
          : status === 'onDuty'
            ? t.colors.statusOnDuty
            : status === 'layover'
              ? t.colors.statusLayover
              : t.colors.statusVerified,
    },
    ring: {
      borderWidth: 2,
      borderColor: t.colors.bgCanvas,
      borderRadius: t.radius.pill,
    },
    hit: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));

  useEffect(() => {
    if (pulseKey === undefined) return;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.35,
        duration: theme.motion.fast,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: theme.motion.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulseKey, scale, theme.motion.fast]);

  const animatedStyle = { transform: [{ scale }] };

  const dot = (
    <Animated.View style={[compact ? styles.ring : null, animatedStyle]}>
      <View style={styles.dot} />
    </Animated.View>
  );

  if (compact) {
    return <View accessibilityLabel={statusLabels[status]}>{dot}</View>;
  }

  return (
    <View style={styles.hit} accessibilityLabel={statusLabels[status]}>
      <Animated.View style={animatedStyle}>
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}
