import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { CrewQrSheet } from '@/components/crew/CrewQrSheet';
import { CloseGlyph, QrGlyph, ScanFrameGlyph, TorchGlyph } from '@/components/crew/qrGlyphs';
import { SCREENS } from '@/constants/screens';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { parseCrewLink } from '@/lib/crewLink';
import { hapticError, hapticSelection } from '@/lib/haptics';
import { fontFamily } from '@/theme';

const INK = '#0E1113';
const LIME = '#A8E05F';
const PALE = '#EDF1F2';
const MUTED = '#A7B1B5';
const DIM = 'rgba(14,17,19,0.62)';
const FRAME = 250;

/** Lime corner brackets around the viewfinder. */
function Brackets() {
  const d = 'M2 30V12a10 10 0 0110-10h18';
  const corner = (rotate: number) => (
    <Svg width={34} height={34} viewBox="0 0 34 34" style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Path d={d} stroke={LIME} strokeWidth={4} fill="none" strokeLinecap="round" />
    </Svg>
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={{ position: 'absolute', top: -2, left: -2 }}>{corner(0)}</View>
      <View style={{ position: 'absolute', top: -2, right: -2 }}>{corner(90)}</View>
      <View style={{ position: 'absolute', bottom: -2, right: -2 }}>{corner(180)}</View>
      <View style={{ position: 'absolute', bottom: -2, left: -2 }}>{corner(270)}</View>
    </View>
  );
}

function ScanLine({ still }: { still: boolean }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [still, y]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        top: still ? FRAME / 2 : 14,
        height: 2,
        borderRadius: 1,
        backgroundColor: LIME,
        shadowColor: LIME,
        shadowOpacity: 0.7,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        transform: still ? [] : [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME - 30] }) }],
      }}
    />
  );
}

function RoundButton({ label, onPress, children, active }: { label: string; onPress: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: active ? LIME : 'rgba(237,241,242,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}>
      {children}
    </Pressable>
  );
}

function PillButton({ label, onPress, tone }: { label: string; onPress: () => void; tone: 'lime' | 'outline' }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        height: 52,
        alignSelf: 'stretch',
        borderRadius: 26,
        backgroundColor: tone === 'lime' ? LIME : 'transparent',
        borderWidth: tone === 'outline' ? 1.5 : 0,
        borderColor: '#2C3134',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: tone === 'lime' ? INK : PALE }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Crew QR scanner: camera with a 250px viewfinder (lime brackets, scan line), close, torch and "Show my QR".
 * Only CrewUp Crew QR links are accepted; a match ticks and opens Add friend. Camera permission is asked after a short
 * explanation; if it's refused, a calm screen offers Settings or your own QR.
 */
export function ScannerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useScreenInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const handledRef = useRef(false);
  const lastBadRef = useRef<{ data: string; at: number } | null>(null);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Coming back from Add friend (Cancel) resumes scanning.
  useFocusEffect(
    useCallback(() => {
      handledRef.current = false;
      return () => setTorch(false);
    }, []),
  );

  useEffect(() => {
    if (!notice) return;
    AccessibilityInfo.announceForAccessibility(notice);
    const timer = setTimeout(() => setNotice(''), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  const onScanned = ({ data }: { data: string }) => {
    if (handledRef.current || qrOpen) return;
    const crewId = parseCrewLink(data);
    if (!crewId) {
      // The same wrong code stays in view: say so once, not on every frame.
      const now = Date.now();
      if (lastBadRef.current?.data === data && now - lastBadRef.current.at < 3000) return;
      lastBadRef.current = { data, at: now };
      hapticError();
      setNotice(t('friends.notCrewCode'));
      return;
    }
    handledRef.current = true;
    hapticSelection();
    router.push(SCREENS.friends.found(crewId));
  };

  const close = () => router.back();
  const showMyQr = () => setQrOpen(true);
  const qrSheet = <CrewQrSheet visible={qrOpen} onClose={() => setQrOpen(false)} onScan={() => setQrOpen(false)} />;

  // Waiting for the permission status.
  if (!permission) return <View style={{ flex: 1, backgroundColor: INK }} />;

  if (!permission.granted) {
    const denied = !permission.canAskAgain;
    return (
      <View style={{ flex: 1, backgroundColor: INK, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }}>
        <StatusBar style="light" />
        <View style={{ alignItems: 'flex-start' }}>
          <RoundButton label={t('common.close')} onPress={close}>
            <CloseGlyph color={PALE} />
          </RoundButton>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#1C2124', borderWidth: 1, borderColor: '#2C3134', alignItems: 'center', justifyContent: 'center' }}>
            <ScanFrameGlyph color={LIME} size={36} />
          </View>
          <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 24, letterSpacing: -0.4, color: PALE, textAlign: 'center' }}>
            {denied ? t('friends.cameraOffTitle') : t('friends.cameraAskTitle')}
          </Text>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 21, color: MUTED, textAlign: 'center', maxWidth: 300 }}>
            {denied ? t('friends.cameraOffBody') : t('friends.cameraAskBody')}
          </Text>
        </View>
        <View style={{ gap: 10 }}>
          {denied ? (
            <PillButton tone="lime" label={t('friends.openSettings')} onPress={() => void Linking.openSettings()} />
          ) : (
            <PillButton tone="lime" label={t('friends.allowCamera')} onPress={() => void requestPermission()} />
          )}
          <PillButton tone="outline" label={t('friends.showMyQr')} onPress={showMyQr} />
        </View>
        {qrSheet}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />
      {/* Dimmed surroundings with a clear 250px window in the middle. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ ...StyleSheet.absoluteFill, flexDirection: 'column' }}>
          <View style={{ flex: 1, backgroundColor: DIM }} />
          <View style={{ height: FRAME, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: DIM }} />
            <View style={{ width: FRAME }} />
            <View style={{ flex: 1, backgroundColor: DIM }} />
          </View>
          <View style={{ flex: 1, backgroundColor: DIM }} />
        </View>
        <View style={{ width: FRAME, height: FRAME, borderRadius: 24, overflow: 'visible' }}>
          <Brackets />
          <ScanLine still={reduceMotion} />
        </View>
      </View>

      <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
        <RoundButton label={t('common.close')} onPress={close}>
          <CloseGlyph color={PALE} />
        </RoundButton>
        <RoundButton label={t('friends.torch')} active={torch} onPress={() => setTorch((on) => !on)}>
          <TorchGlyph color={torch ? INK : PALE} on={torch} />
        </RoundButton>
      </View>

      <View style={{ position: 'absolute', left: 24, right: 24, top: '50%', marginTop: FRAME / 2 + 24, alignItems: 'center', gap: 10 }}>
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14.5, color: PALE, textAlign: 'center' }}>{t('friends.scanHint')}</Text>
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: INK, backgroundColor: PALE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: 'hidden' }}>
            {notice}
          </Text>
        ) : null}
      </View>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24 }}>
        <Pressable
          accessibilityRole="button"
          onPress={showMyQr}
          style={({ pressed }) => ({
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(237,241,242,0.16)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.8 : 1,
          })}>
          <QrGlyph color={PALE} size={15} />
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: PALE }}>{t('friends.showMyQr')}</Text>
        </Pressable>
      </View>
      {qrSheet}
    </View>
  );
}
