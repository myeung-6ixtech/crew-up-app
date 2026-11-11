import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { CoverCropModal, type CoverSource } from '@/components/events/CoverCropModal';
import { STORAGE_BUCKETS } from '@/constants/storage';
import { useStorageFileUri } from '@/hooks/useStorageFileUri';
import { hapticSelection } from '@/lib/haptics';
import { uploadFile } from '@/services/uploadService';
import { fontFamily, useTheme } from '@/theme';

const MAX_COVER_BYTES = 10 * 1024 * 1024;

export type EventCoverPick = {
  /** The 1280×720 crop that gets uploaded. */
  uri: string;
  mimeType: string;
  /** The original photo, kept so Adjust crop can reopen it. */
  source?: CoverSource;
};

/** The photo as picked; it goes straight to the 16:9 crop (iOS's own editor only crops square). */
async function pickCoverSource(): Promise<{ status: 'picked'; source: CoverSource } | { status: 'cancelled' } | { status: 'too_large' }> {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
  const asset = picked.canceled ? null : picked.assets[0];
  if (!asset) return { status: 'cancelled' };
  if (asset.fileSize && asset.fileSize > MAX_COVER_BYTES) return { status: 'too_large' };
  return { status: 'picked', source: { uri: asset.uri, width: asset.width, height: asset.height } };
}

export async function uploadEventCover(cover: EventCoverPick) {
  return uploadFile({
    uri: cover.uri,
    name: 'event-cover.jpg',
    mimeType: cover.mimeType,
    bucketId: STORAGE_BUCKETS.media,
  });
}

function PhotoGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={14} rx={2.5} stroke={color} strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1.6} fill={color} />
      <Path d="M4 17l5-4.5 3.5 3 3-2.5L20 17" stroke={color} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function CropGlyph({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Path d="M6 2v16h16M2 6h16v16" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Featured image — design/…/CrewUp Events Prototype.dc.html, 6D (Create) and 6F·2 (Edit), the only two places a
 * photo changes. Optional; picking opens the 16:9 crop. After that: Adjust crop, Replace or Remove.
 */
export function EventCoverField({
  cover,
  fileId,
  onChange,
  onClear,
  onError,
  hint,
}: {
  /** A new photo picked here, not yet uploaded. */
  cover: EventCoverPick | null;
  /** The meet's current photo (Edit). */
  fileId?: string | null;
  onChange: (cover: EventCoverPick) => void;
  onClear: () => void;
  onError: (message: string) => void;
  hint: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const remote = useStorageFileUri(cover ? null : fileId);
  const [cropping, setCropping] = useState<CoverSource | null>(null);
  const uri = cover?.uri || remote.uri;
  const hasImage = Boolean(uri);
  const border = theme.mode === 'dark' ? '#3A4145' : '#C9CEC1';

  const pick = async () => {
    const result = await pickCoverSource();
    if (result.status === 'too_large') return onError(t('events.coverTooLarge'));
    if (result.status === 'picked') setCropping(result.source);
  };

  return (
    <View>
      {hasImage ? (
        <>
          <View style={{ aspectRatio: 16 / 9, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0E1113' }}>
            <Image
              source={cover || !remote.headers ? { uri: uri as string } : { uri: uri as string, headers: remote.headers }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              accessibilityLabel={t('events.coverA11y')}
            />
            <View style={{ position: 'absolute', left: 10, top: 10, height: 24, paddingHorizontal: 8, borderRadius: 7, backgroundColor: 'rgba(14,17,19,0.7)', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10, letterSpacing: 0.8, color: '#F7F8F4' }}>16:9</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {cover?.source ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setCropping(cover.source ?? null)}
                style={({ pressed }) => ({ flex: 1, height: 42, borderRadius: 21, backgroundColor: '#0E1113', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.8 : 1 })}>
                <CropGlyph color="#A8E05F" />
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: '#A8E05F' }}>{t('events.coverAdjust')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => void pick()}
              style={({ pressed }) => ({ flex: 1, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>{t('events.coverReplace')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                hapticSelection();
                onClear();
              }}
              style={({ pressed }) => ({ height: 42, paddingHorizontal: 16, borderRadius: 21, borderWidth: 1.5, borderColor: border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.mode === 'dark' ? '#FF8A80' : '#B3261E' }}>{t('events.coverRemove')}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={hint}
          onPress={() => void pick()}
          style={({ pressed }) => ({
            aspectRatio: 16 / 9,
            borderRadius: 18,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: '#B9BEB2',
            backgroundColor: pressed ? theme.colors.field : theme.colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingHorizontal: 24,
          })}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
            <PhotoGlyph color={theme.colors.textSecondary} />
          </View>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: theme.colors.textPrimary }}>{t('events.coverAdd')}</Text>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 230 }}>{hint}</Text>
        </Pressable>
      )}
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 8 }}>{t('events.coverListingNote')}</Text>

      <CoverCropModal
        source={cropping}
        onCancel={() => setCropping(null)}
        onDone={(result) => {
          const source = cropping ?? undefined;
          setCropping(null);
          onChange({ ...result, source });
        }}
      />
    </View>
  );
}
