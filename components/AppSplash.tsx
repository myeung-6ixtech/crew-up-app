import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

const INK = '#0E1113';
const LIME = '#A8E05F';

/**
 * Launch splash — design/…/CrewUp - Add Trip Flow.dc.html, 00 Splash. Dark ground and the lime wordmark, the
 * same as the sign-up entry screen. It matches the native splash, so the hand-off is invisible; then the logo
 * beats and three lime dots bounce until the session resolves and the guard routes on.
 */
export function AppSplash() {
  const beat = useRef(new Animated.Value(1)).current;
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let loops: Animated.CompositeAnimation[] = [];
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      // Two quick beats then a rest, like the design's cuHeartbeat (1.4s).
      const heartbeat = Animated.loop(
        Animated.sequence([
          Animated.timing(beat, { toValue: 1.08, duration: 196, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(beat, { toValue: 1, duration: 196, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(beat, { toValue: 1.05, duration: 196, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(beat, { toValue: 1, duration: 392, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(420),
        ]),
      );
      // cuBounce: up 12px at 40% of 1.2s, staggered 160ms.
      const bounces = dots.map((dot, index) =>
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.loop(
            Animated.sequence([
              Animated.timing(dot, { toValue: 1, duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(dot, { toValue: 0, duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.delay(240),
            ]),
          ),
        ]),
      );
      loops = [heartbeat, ...bounces];
      loops.forEach((loop) => loop.start());
    });
    return () => {
      cancelled = true;
      loops.forEach((loop) => loop.stop());
    };
  }, [beat, dots]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="CrewUp, loading"
      onLayout={() => void SplashScreen.hideAsync()}
      style={{ flex: 1, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar style="light" />
      {/* Logo dead centre, where the native splash draws it; the dots hang below without moving it. */}
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale: beat }] }}>
          <Image source={require('@/assets/logos/crewup-wordmark-lime-2400.png')} resizeMode="contain" style={{ width: 210, height: 60 }} />
        </Animated.View>
        <View style={{ position: 'absolute', top: 60 + 36, flexDirection: 'row', gap: 10, height: 28, alignItems: 'flex-end' }}>
          {dots.map((dot, index) => (
            <Animated.View
              key={index}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: LIME,
                opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }],
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
