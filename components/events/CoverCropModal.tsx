import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StatusBar, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily } from '@/theme';

/**
 * Crop to 16:9 — design/…/CrewUp Events Prototype.dc.html, 6D·2. Opens straight after picking a photo (and
 * again from Adjust crop). Drag to reposition, pinch or slide to zoom; Done saves a 1280×720 JPEG.
 */

export type CoverSource = { uri: string; width: number; height: number };
export type CropResult = { uri: string; mimeType: string };

const OUT_W = 1280;
const OUT_H = 720;
const MAX_ZOOM = 3;
const LIME = '#A8E05F';

type Crop = { z: number; ox: number; oy: number };

function MountainGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={14} rx={2.5} stroke="#A7B1B5" strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1.6} fill="#A7B1B5" />
      <Path d="M4 17l5-4.5 3.5 3 3-2.5L20 17" stroke="#A7B1B5" strokeWidth={1.8} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

export function CoverCropModal({
  source,
  onCancel,
  onDone,
}: {
  source: CoverSource | null;
  onCancel: () => void;
  onDone: (result: CropResult) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const frameW = screenW - 32;
  const frameH = (frameW * 9) / 16;
  const stageH = Math.round(frameH + 230);
  const frameTop = (stageH - frameH) / 2;
  const [crop, setCrop] = useState<Crop>({ z: 1, ox: 0, oy: 0 });
  const [saving, setSaving] = useState(false);
  const start = useRef<Crop>(crop);
  const trackW = useRef(0);

  const base = source ? Math.max(frameW / source.width, frameH / source.height) : 1;

  const clamp = (next: Crop): Crop => {
    if (!source) return next;
    const scale = base * next.z;
    const dw = source.width * scale;
    const dh = source.height * scale;
    return { z: next.z, ox: Math.min(0, Math.max(frameW - dw, next.ox)), oy: Math.min(0, Math.max(frameH - dh, next.oy)) };
  };

  // Centre the photo each time a new one opens.
  useEffect(() => {
    if (!source) return;
    const dw = source.width * base;
    const dh = source.height * base;
    setCrop({ z: 1, ox: (frameW - dw) / 2, oy: (frameH - dh) / 2 });
  }, [base, frameH, frameW, source]);

  /** Zoom about the frame's centre so the subject stays put. */
  const zoomTo = (from: Crop, z: number): Crop => {
    const nz = Math.min(MAX_ZOOM, Math.max(1, z));
    const s0 = base * from.z;
    const s1 = base * nz;
    const cx = (frameW / 2 - from.ox) / s0;
    const cy = (frameH / 2 - from.oy) / s0;
    return clamp({ z: nz, ox: frameW / 2 - cx * s1, oy: frameH / 2 - cy * s1 });
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      start.current = crop;
    })
    .onUpdate((event) => setCrop(clamp({ ...start.current, ox: start.current.ox + event.translationX, oy: start.current.oy + event.translationY })));
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      start.current = crop;
    })
    .onUpdate((event) => setCrop(zoomTo(start.current, start.current.z * event.scale)));
  const slide = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((event) => setCrop((current) => zoomTo(current, 1 + (Math.max(0, Math.min(trackW.current, event.x)) / (trackW.current || 1)) * (MAX_ZOOM - 1))))
    .onUpdate((event) => setCrop((current) => zoomTo(current, 1 + (Math.max(0, Math.min(trackW.current, event.x)) / (trackW.current || 1)) * (MAX_ZOOM - 1))));

  const done = async () => {
    if (!source || saving) return;
    setSaving(true);
    try {
      const scale = base * crop.z;
      const originX = Math.max(0, -crop.ox / scale);
      const originY = Math.max(0, -crop.oy / scale);
      const width = Math.min(source.width - originX, frameW / scale);
      const height = Math.min(source.height - originY, frameH / scale);
      const context = ImageManipulator.manipulate(source.uri);
      context.crop({ originX, originY, width, height }).resize({ width: OUT_W, height: OUT_H });
      const image = await context.renderAsync();
      const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.88 });
      onDone({ uri: saved.uri, mimeType: 'image/jpeg' });
    } finally {
      setSaving(false);
    }
  };

  const scale = base * crop.z;
  const fraction = (crop.z - 1) / (MAX_ZOOM - 1);

  return (
    <Modal visible={Boolean(source)} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0E1113', paddingTop: insets.top }}>
        <StatusBar barStyle="light-content" />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 6, paddingHorizontal: 16 }}>
          <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={10} style={{ width: 80 }}>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: '#EDF1F2' }}>{t('common.cancel')}</Text>
          </Pressable>
          <Text accessibilityRole="header" style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 16, color: '#EDF1F2' }}>
            {t('events.crop.title')}
          </Text>
          <View style={{ width: 80, alignItems: 'flex-end' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: saving }}
              onPress={() => void done()}
              style={({ pressed }) => ({ height: 34, paddingHorizontal: 16, borderRadius: 17, backgroundColor: LIME, justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
              {saving ? <ActivityIndicator color="#0E1113" /> : <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: '#0E1113' }}>{t('events.crop.done')}</Text>}
            </Pressable>
          </View>
        </View>

        <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
          <View accessibilityLabel={t('events.crop.stageA11y')} style={{ height: stageH, marginTop: 16, overflow: 'hidden' }}>
            {source ? (
              <Image
                source={{ uri: source.uri }}
                style={{ position: 'absolute', left: 16 + crop.ox, top: frameTop + crop.oy, width: source.width * scale, height: source.height * scale }}
                accessibilityIgnoresInvertColors
              />
            ) : null}
            {/* Dim everything outside the frame. */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: frameTop, backgroundColor: 'rgba(14,17,19,0.66)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: frameTop + frameH, bottom: 0, backgroundColor: 'rgba(14,17,19,0.66)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, width: 16, top: frameTop, height: frameH, backgroundColor: 'rgba(14,17,19,0.66)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', right: 0, width: 16, top: frameTop, height: frameH, backgroundColor: 'rgba(14,17,19,0.66)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', left: 16, top: frameTop, width: frameW, height: frameH, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 4 }}>
              {[1 / 3, 2 / 3].map((at) => (
                <View key={`v${at}`} style={{ position: 'absolute', left: `${at * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
              ))}
              {[1 / 3, 2 / 3].map((at) => (
                <View key={`h${at}`} style={{ position: 'absolute', top: `${at * 100}%`, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
              ))}
            </View>
          </View>
        </GestureDetector>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 18, paddingHorizontal: 28 }}>
          <MountainGlyph size={16} />
          <GestureDetector gesture={slide}>
            <View
              accessibilityRole="adjustable"
              accessibilityLabel={t('events.crop.zoom')}
              accessibilityValue={{ min: 100, max: MAX_ZOOM * 100, now: Math.round(crop.z * 100) }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={({ nativeEvent }) => setCrop((current) => zoomTo(current, current.z + (nativeEvent.actionName === 'increment' ? 0.2 : -0.2)))}
              onLayout={(event) => {
                trackW.current = event.nativeEvent.layout.width;
              }}
              style={{ flex: 1, height: 32, justifyContent: 'center' }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: '#2C3134' }}>
                <View style={{ width: `${fraction * 100}%`, height: 4, borderRadius: 2, backgroundColor: LIME }} />
              </View>
              <View style={{ position: 'absolute', left: `${fraction * 100}%`, marginLeft: -11, width: 22, height: 22, borderRadius: 11, backgroundColor: LIME }} />
            </View>
          </GestureDetector>
          <MountainGlyph size={22} />
        </View>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 19, color: '#A7B1B5', textAlign: 'center', paddingTop: 14, paddingHorizontal: 32 }}>
          {t('events.crop.hint')}
        </Text>
      </GestureHandlerRootView>
    </Modal>
  );
}
