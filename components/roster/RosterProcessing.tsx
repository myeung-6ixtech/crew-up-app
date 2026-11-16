import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { DarkLimePill, DarkOutlinePill, MonoLabel, TextPillAction } from '@/features/onboarding/components/kit';
import { ROSTER_READ_CONFIG } from '@/lib/rosterRead';
import { fontFamily } from '@/theme';

const INK = '#0E1113';
const LIME = '#A8E05F';
const PALE = '#EDF1F2';
const MUTED = '#A7B1B5';
const FAINT = '#7D878B';
const CARD = '#1C2124';
const LINE = '#2C3134';

/** Decorative roster page: duty rows light up as the scan passes. Flights are the long bars. */
const DOC_ROWS: { tag: string; flight: boolean }[] = [
  { tag: 'OFF', flight: false },
  { tag: 'FLT', flight: true },
  { tag: 'FLT', flight: true },
  { tag: 'OFF', flight: false },
  { tag: 'FLT', flight: true },
  { tag: 'FLT', flight: true },
  { tag: 'SBY', flight: false },
  { tag: 'FLT', flight: true },
  { tag: 'FLT', flight: true },
];

export type ProcessingPhase = 'uploading' | 'reading' | 'done';

/**
 * Full-page dark wait state while a roster is read. Uploading is real; the reading stages and the bar
 * advance on a timer (the parser doesn't report progress) and hold short of 100% until the result arrives.
 * The counters only show real numbers once it's done.
 */
const THINKING_STAGES = ['rosterFlow.stage.thinking', 'rosterFlow.stage.reasoning', 'rosterFlow.stage.checkingTimes'] as const;

/** "Thinking…" with three dots that fill in turn. */
function AnimatedDots({ color }: { color: string }) {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => setCount((value) => (value % 3) + 1), 400);
    return () => clearInterval(timer);
  }, []);
  return (
    <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color, width: 18 }}>
      {'.'.repeat(count)}
    </Text>
  );
}

/** A soft lime sweep over the held bar, so a frozen value still reads as working. */
function Shimmer() {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [x]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
        backgroundColor: 'rgba(237,241,242,0.35)',
        transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-60, 320] }) }],
      }}
    />
  );
}

const clockLabel = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export function RosterProcessing({
  fileName,
  phase,
  thinking = false,
  startedAt,
  trips,
  flights,
  layovers,
  onReview,
  onCancel,
}: {
  fileName: string;
  phase: ProcessingPhase;
  /** The provider was busy once: rotate "Thinking…" and hold the bar (it never moves back). */
  thinking?: boolean;
  /** When the read started, for "Taking longer than expected" and the elapsed time. */
  startedAt?: number;
  trips: number;
  flights: number;
  layovers: number;
  onReview: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const insets = useScreenInsets();
  const [progress, setProgress] = useState(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;
  const [now, setNow] = useState(() => Date.now());
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!thinking) return;
    const timer = setInterval(() => setStageIndex((index) => (index + 1) % THINKING_STAGES.length), 2500);
    return () => clearInterval(timer);
  }, [thinking]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((current) => {
        if (phaseRef.current === 'done') return 100;
        // Thinking holds the bar where it is: it may pause, but never goes backwards.
        if (thinkingRef.current) return current;
        // Uploading tops out at 15%; reading eases towards 92% and waits there.
        const cap = phaseRef.current === 'uploading' ? 15 : 92;
        const step = current < 40 ? 1.4 : 0.6;
        return Math.min(cap, current + step);
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const done = phase === 'done' && progress >= 100;
  const elapsedMs = startedAt ? now - startedAt : 0;
  const slow = !done && Boolean(startedAt) && elapsedMs >= ROSTER_READ_CONFIG.slowAfterMs;
  const mode: 'reading' | 'thinking' | 'slow' | 'done' = done ? 'done' : slow ? 'slow' : thinking ? 'thinking' : 'reading';

  // Say each change of state out loud once (the visible text also sits in live regions).
  const announced = useRef(mode);
  useEffect(() => {
    if (announced.current === mode) return;
    announced.current = mode;
    const message =
      mode === 'thinking' ? t('rosterFlow.thinkingBody') : mode === 'slow' ? t('rosterFlow.slowTitle') : mode === 'done' ? t('rosterFlow.readyTitle') : '';
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [mode, t]);

  const stage =
    mode === 'slow'
      ? t('rosterFlow.stage.stillReasoning')
      : mode === 'thinking'
        ? t(THINKING_STAGES[stageIndex])
        : done ? t('rosterFlow.stage.done') : progress < 15 ? t('rosterFlow.stage.uploading') : progress < 40 ? t('rosterFlow.stage.reading') : progress < 75 ? t('rosterFlow.stage.finding') : t('rosterFlow.stage.checking');
  const litRows = Math.floor((progress / 100) * DOC_ROWS.length);
  const scanTop = `${((progress % 34) / 34) * 100}%` as const;

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>
      <StatusBar style="light" />
      <Text style={{ textAlign: 'center', fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 1, color: FAINT, paddingTop: insets.top + 6 }}>
        {fileName.toUpperCase()}
      </Text>
      <View style={{ flex: 1, paddingHorizontal: 28 }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: 236, height: 268, alignSelf: 'center', marginTop: 22 }}>
          <View style={{ position: 'absolute', left: 16, right: -16, top: 14, bottom: -14, borderRadius: 14, backgroundColor: LINE }} />
          <View style={{ position: 'absolute', left: 8, right: -8, top: 7, bottom: -7, borderRadius: 14, backgroundColor: '#4A5256' }} />
          <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 14, backgroundColor: '#F7F8F4', paddingVertical: 16, paddingHorizontal: 14, gap: 6, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#DDE1D6' }}>
              <View style={{ width: 90, height: 7, borderRadius: 4, backgroundColor: INK }} />
              <View style={{ width: 40, height: 7, borderRadius: 4, backgroundColor: '#C9CEC1' }} />
            </View>
            {DOC_ROWS.map((row, index) => {
              const lit = row.flight && index < litRows;
              return (
                <View key={index} style={{ height: 18, borderRadius: 6, backgroundColor: lit ? '#EEF7DF' : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 }}>
                  <View style={{ width: 22, height: 5, borderRadius: 3, backgroundColor: lit ? '#4F6E19' : '#C9CEC1' }} />
                  <View style={{ width: row.flight ? '52%' : '30%', height: 5, borderRadius: 3, backgroundColor: lit ? INK : row.flight ? '#B9BEB2' : '#DDE1D6' }} />
                  <Text
                    style={{
                      marginLeft: 'auto',
                      fontFamily: fontFamily.monoMedium,
                      fontSize: 8.5,
                      color: lit ? INK : '#9AA092',
                      backgroundColor: lit ? LIME : 'transparent',
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 4,
                      overflow: 'hidden',
                      opacity: row.flight ? (lit ? 1 : 0) : 1,
                    }}>
                    {row.tag}
                  </Text>
                </View>
              );
            })}
          </View>
          {!done ? (
            <View
              style={{
                position: 'absolute',
                left: -10,
                right: -10,
                top: scanTop,
                height: 2,
                borderRadius: 1,
                backgroundColor: LIME,
                shadowColor: LIME,
                shadowOpacity: 0.55,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          ) : null}
        </View>

        <View style={{ alignItems: 'center', gap: 8, marginTop: 34 }}>
          <Text
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            style={{ fontFamily: fontFamily.jakartaBold, fontSize: 27, letterSpacing: -0.7, color: PALE, textAlign: 'center' }}>
            {done ? t('rosterFlow.readyTitle') : mode === 'slow' ? t('rosterFlow.slowTitle') : t('rosterFlow.readingTitle')}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: MUTED, textAlign: 'center', maxWidth: 300 }}>
            {done
              ? t('rosterFlow.readyBody', { count: trips })
              : mode === 'slow'
                ? t('rosterFlow.slowBody')
                : mode === 'thinking'
                  ? t('rosterFlow.thinkingBody')
                  : progress < 40
                    ? t('rosterFlow.readingRedacting')
                    : t('rosterFlow.readingFinding')}
          </Text>
        </View>

        <View style={{ gap: 8, marginTop: 22 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.floor(progress) }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: LINE, overflow: 'hidden' }}>
            <View style={{ width: `${progress}%`, height: '100%', borderRadius: 3, backgroundColor: LIME, overflow: 'hidden' }}>
              {mode === 'thinking' || mode === 'slow' ? <Shimmer /> : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MonoLabel style={{ fontSize: 10.5, color: LIME }}>{stage}</MonoLabel>
              {mode === 'thinking' || mode === 'slow' ? <AnimatedDots color={LIME} /> : null}
            </View>
            <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: FAINT }}>
              {mode === 'slow' ? clockLabel(elapsedMs) : `${Math.floor(progress)}%`}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          {[
            { key: 'flights', label: t('rosterFlow.flightsFound'), value: flights },
            { key: 'layovers', label: t('rosterFlow.layoversFound'), value: layovers },
          ].map((counter) => (
            <View key={counter.key} style={{ flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, gap: 2 }}>
              <MonoLabel style={{ fontSize: 9.5, color: FAINT }}>{counter.label}</MonoLabel>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 24, color: PALE }}>{done ? counter.value : '—'}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 'auto', paddingBottom: Math.max(insets.bottom, 14), gap: 10 }}>
          {done ? (
            <DarkLimePill label={t('rosterFlow.reviewTrips')} onPress={onReview} />
          ) : (
            <>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: FAINT, textAlign: 'center' }}>
                {mode === 'slow' ? t('rosterFlow.slowFooter') : t('rosterFlow.keepOpen')}
              </Text>
              <TextPillAction label={t('rosterFlow.cancelImport')} color={MUTED} onPress={onCancel} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * The reader stayed busy past the retries or the time budget. Calm copy only: no red, no "error", no status code.
 * Try again reads the same file from the phone again.
 */
export function RosterTryLater({ onTryAgain, onManual, onNotNow }: { onTryAgain: () => void; onManual: () => void; onNotNow: () => void }) {
  const { t } = useTranslation();
  const insets = useScreenInsets();
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(t('rosterFlow.tryLaterTitle'));
  }, [t]);
  return (
    <View style={{ flex: 1, backgroundColor: INK, paddingTop: insets.top, paddingHorizontal: 28 }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' }}>
          <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 26, color: LIME }}>
            ⋯
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={{ fontFamily: fontFamily.jakartaBold, fontSize: 27, letterSpacing: -0.7, color: PALE, textAlign: 'center', marginTop: 10 }}>
          {t('rosterFlow.tryLaterTitle')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: MUTED, textAlign: 'center', maxWidth: 310 }}>
          {t('rosterFlow.tryLaterBody')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 19, color: FAINT, textAlign: 'center', maxWidth: 300, marginTop: 4 }}>
          {t('rosterFlow.tryLaterNote')}
        </Text>
      </View>
      <View style={{ gap: 10, paddingBottom: Math.max(insets.bottom, 14) }}>
        <DarkLimePill label={t('rosterFlow.tryAgain')} onPress={onTryAgain} />
        <DarkOutlinePill label={t('rosterFlow.addManually')} onPress={onManual} />
        <TextPillAction label={t('rosterFlow.notNow')} color={MUTED} onPress={onNotNow} />
      </View>
    </View>
  );
}
