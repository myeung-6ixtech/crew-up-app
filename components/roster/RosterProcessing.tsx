import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkLimePill, MonoLabel, TextPillAction } from '@/features/onboarding/components/kit';
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
export function RosterProcessing({
  fileName,
  phase,
  trips,
  flights,
  layovers,
  onReview,
  onCancel,
}: {
  fileName: string;
  phase: ProcessingPhase;
  trips: number;
  flights: number;
  layovers: number;
  onReview: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((current) => {
        if (phaseRef.current === 'done') return 100;
        // Uploading tops out at 15%; reading eases towards 92% and waits there.
        const cap = phaseRef.current === 'uploading' ? 15 : 92;
        const step = current < 40 ? 1.4 : 0.6;
        return Math.min(cap, current + step);
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const done = phase === 'done' && progress >= 100;
  const stage =
    done ? t('rosterFlow.stage.done') : progress < 15 ? t('rosterFlow.stage.uploading') : progress < 40 ? t('rosterFlow.stage.reading') : progress < 75 ? t('rosterFlow.stage.finding') : t('rosterFlow.stage.checking');
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
          <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 27, letterSpacing: -0.7, color: PALE, textAlign: 'center' }}>
            {done ? t('rosterFlow.readyTitle') : t('rosterFlow.readingTitle')}
          </Text>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: MUTED, textAlign: 'center', maxWidth: 290 }}>
            {done
              ? t('rosterFlow.readyBody', { count: trips })
              : progress < 40
                ? t('rosterFlow.readingRedacting')
                : t('rosterFlow.readingFinding')}
          </Text>
        </View>

        <View style={{ gap: 8, marginTop: 22 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.floor(progress) }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: LINE, overflow: 'hidden' }}>
            <View style={{ width: `${progress}%`, height: '100%', borderRadius: 3, backgroundColor: LIME }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <MonoLabel style={{ fontSize: 10.5, color: LIME }}>{stage}</MonoLabel>
            <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: FAINT }}>{`${Math.floor(progress)}%`}</Text>
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
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: FAINT, textAlign: 'center' }}>{t('rosterFlow.keepOpen')}</Text>
              <TextPillAction label={t('rosterFlow.cancelImport')} color={MUTED} onPress={onCancel} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}
