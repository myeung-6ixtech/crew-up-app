import { Image, Text, View } from 'react-native';
import { useStorageFileUri } from '@/hooks/useStorageFileUri';
import { fontFamily, useTheme } from '@/theme';
import { CameraGlyph } from './PhotoSourceSheet';

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/[\s,]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

/**
 * Round profile photo with initials fallback.
 * `picker`: dashed empty state with a lime "+" badge; once set, a lime ring and a camera badge to change it.
 * `lime`: solid lime initials (review card).
 */
export function PhotoCircle({
  size,
  name,
  fileId,
  localUri,
  tone,
  uploading,
  uploadingLabel,
}: {
  size: number;
  name?: string | null;
  fileId?: string | null;
  localUri?: string | null;
  tone: 'picker' | 'lime';
  uploading?: boolean;
  uploadingLabel?: string;
}) {
  const theme = useTheme();
  const { uri: remoteUri, headers } = useStorageFileUri(fileId);
  const imageUri = localUri ?? remoteUri;
  const picker = tone === 'picker';
  const badge = Math.round(size * 0.27);

  const ringed = picker && Boolean(imageUri);
  const inner = ringed ? size - 8 : size;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: ringed ? theme.colors.fill : 'transparent',
        }}>
        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: picker ? theme.colors.field : theme.colors.fill,
            borderWidth: ringed ? 3 : picker ? 2 : 0,
            borderStyle: ringed ? 'solid' : 'dashed',
            borderColor: ringed ? theme.colors.ground : theme.colors.textTertiary,
          }}>
          {imageUri ? (
            <Image
              source={headers ? { uri: imageUri, headers } : { uri: imageUri }}
              style={{ width: inner, height: inner }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text
              style={{
                fontFamily: fontFamily.jakartaBold,
                fontSize: Math.round(size * 0.3),
                color: picker ? theme.colors.textTertiary : theme.colors.onFill,
              }}>
              {initialsOf(name)}
            </Text>
          )}
          {uploading ? (
            <View
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(14,17,19,0.55)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, letterSpacing: 1.1, color: '#EDF1F2' }}>
                {uploadingLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {picker ? (
        <View
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            width: badge,
            height: badge,
            borderRadius: badge / 2,
            backgroundColor: ringed ? theme.colors.ink : theme.colors.fill,
            borderWidth: 3,
            borderColor: theme.colors.ground,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {ringed ? (
            <CameraGlyph color={theme.colors.fill} size={16} strokeWidth={2.2} />
          ) : (
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, lineHeight: 24, color: theme.colors.onFill }}>+</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
