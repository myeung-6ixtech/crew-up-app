import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/theme';

const INK = '#0E1113';
const TRAY = '#080A0B';
const TILE = '#1C2124';
const TILE_TOP = '#22282B';
const HINGE = '#0A0C0D';
const LIME = '#A8E05F';
const FLICKER = 'rgba(237,241,242,0.75)';

/**
 * Wordmark size, matching the native splash (app.json → expo-splash-screen). Android 12+ crops the splash icon to a
 * 192dp circle, so a 210dp-wide wordmark loses its ends there; 180dp (about 52dp tall) fits inside it.
 */
const LOGO_WIDTH = Platform.OS === 'android' ? 180 : 210;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 60) / 210);

/** The board's words and timing. Words are centred and padded to TILE_COUNT. */
export const SPLASH_BOARD = {
  words: ['WELCOME', 'BOARDING', 'CREW UP'],
  tileCount: 8,
  /** One word, flicker to settled to the hold before the next. */
  wordMs: 3_200,
  /** Random characters change this often while a tile flickers. */
  flickerMs: 70,
  /** The first tile settles this long into a word… */
  settleStartMs: 250,
  /** …then one more tile every this many ms, left to right. */
  settleStepMs: 110,
} as const;

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

/** "CREW UP" → " CREW UP" style centring inside the tile row. */
export function padWord(word: string, count: number = SPLASH_BOARD.tileCount) {
  const text = word.toUpperCase().slice(0, count);
  const left = Math.floor((count - text.length) / 2);
  return text.padStart(left + text.length, ' ').padEnd(count, ' ');
}

/**
 * The board runs on one clock shared across mounts: the splash remounts as fonts, the session and routing resolve,
 * and the board should carry on rather than restart.
 */
let boardEpoch = 0;

type Tile = { char: string; settled: boolean };

function boardAt(elapsedMs: number): Tile[] {
  const { words, tileCount, wordMs, settleStartMs, settleStepMs } = SPLASH_BOARD;
  const target = padWord(words[Math.floor(elapsedMs / wordMs) % words.length]);
  const inWord = elapsedMs % wordMs;
  return Array.from({ length: tileCount }, (_, index) =>
    inWord >= settleStartMs + index * settleStepMs ? { char: target[index], settled: true } : { char: randomChar(), settled: false },
  );
}

function FlapTile({ tile }: { tile: Tile }) {
  return (
    <View style={{ width: 30, height: 42, borderRadius: 5, backgroundColor: TILE, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {/* Lighter top flap and the hinge across the middle. */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 21, backgroundColor: TILE_TOP }} />
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: fontFamily.monoMedium,
          fontSize: 22,
          color: tile.settled ? LIME : FLICKER,
          // A mid-flip flap reads slightly squashed.
          transform: [{ scaleY: tile.settled ? 1 : 0.86 }],
        }}>
        {tile.char === ' ' ? '' : tile.char}
      </Text>
      <View style={{ position: 'absolute', top: 20.5, left: 0, right: 0, height: 1, backgroundColor: HINGE }} />
    </View>
  );
}

function PulseDot({ still }: { still: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, still]);
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: LIME, opacity: pulse }} />;
}

/**
 * Launch splash — Add Trip Flow, frame 4A. The lime wordmark sits where the native splash draws it, so the hand-off is
 * invisible; below it a split-flap departure board cycles WELCOME → BOARDING → CREW UP until the session resolves and
 * the guard routes on. The parent unmounts it the moment loading ends, mid-word if need be. Reduce Motion shows the
 * settled word without flicker.
 */
export function AppSplash() {
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [tiles, setTiles] = useState<Tile[]>(() => padWord(SPLASH_BOARD.words[0]).split('').map((char) => ({ char, settled: true })));

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (active) setReduceMotion(reduce);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion !== false) return;
    if (!boardEpoch) boardEpoch = Date.now();
    const tick = () => setTiles(boardAt(Date.now() - boardEpoch));
    tick();
    const timer = setInterval(tick, SPLASH_BOARD.flickerMs);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <View onLayout={() => void SplashScreen.hideAsync()} style={{ flex: 1, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar style="light" />
      {/* Logo dead centre; the board hangs below without moving it. */}
      <View style={{ alignItems: 'center' }}>
        <Image
          accessibilityIgnoresInvertColors
          accessible
          accessibilityLabel="CrewUp"
          source={require('@/assets/logos/crewup-wordmark-lime-2400.png')}
          resizeMode="contain"
          style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
        />
        <View style={{ position: 'absolute', top: LOGO_HEIGHT + 32, alignItems: 'center', gap: 16 }}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ flexDirection: 'row', gap: 4, padding: 10, borderRadius: 12, backgroundColor: TRAY }}>
            {tiles.map((tile, index) => (
              <FlapTile key={index} tile={tile} />
            ))}
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t('splash.loading')}
            accessibilityLiveRegion="polite"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PulseDot still={reduceMotion !== false} />
            <Text allowFontScaling={false} style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 1.2, color: 'rgba(237,241,242,0.6)' }}>
              {t('splash.loadingTrips')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
