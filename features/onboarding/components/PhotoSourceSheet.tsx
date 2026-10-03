import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import { pickAndUploadAvatar, type PhotoSource } from '../steps/PhotoStep';
import { CheckBadge, TextPillAction } from './kit';

export function CameraGlyph({ color, size = 22, strokeWidth = 2 }: { color: string; size?: number; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2z"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12.5} r={3.5} stroke={color} strokeWidth={strokeWidth} fill="none" />
    </Svg>
  );
}

function LibraryGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x={3} y={4} width={18} height={16} rx={3} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={9} cy={9.5} r={1.8} fill={color} />
      <Path d="M4 17l5-4.5 3.5 3 3-2.5L20 17" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Photo state for the display-name screen and Edit profile.
 * The local image shows immediately with an "uploading" veil, then the stored file id replaces it.
 */
export function useAvatarPicker(initialFileId: string | null, onUploaded?: (fileId: string) => Promise<void>) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fileId, setFileId] = useState<string | null>(initialFileId);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const pendingSource = useRef<PhotoSource | null>(null);

  const uploadFrom = async (source: PhotoSource) => {
    setError('');
    const previous = previewUri;
    try {
      const result = await pickAndUploadAvatar(source, (uri) => {
        setPreviewUri(uri);
        setUploading(true);
      });
      if (result.status === 'too_large') {
        hapticError();
        setError(t('onboarding.photo.tooLarge'));
      }
      if (result.status === 'no_permission') {
        hapticError();
        setError(t('onboarding.photo.cameraDenied'));
      }
      if (result.status === 'uploaded') {
        await onUploaded?.(result.fileId);
        hapticSuccess();
        setFileId(result.fileId);
        setPreviewUri(result.uri);
      }
    } catch {
      hapticError();
      setPreviewUri(previous);
      setError(t('onboarding.genericError'));
    } finally {
      setUploading(false);
    }
  };

  const choose = (source: PhotoSource) => {
    pendingSource.current = source;
    setSheetOpen(false);
  };

  const onSheetDismissed = () => {
    const source = pendingSource.current;
    pendingSource.current = null;
    if (!source) return;
    void uploadFrom(source);
  };

  return {
    fileId,
    previewUri,
    hasPhoto: Boolean(previewUri || fileId),
    uploading,
    error,
    open: () => setSheetOpen(true),
    sheet: (
      <PhotoSourceSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onDismissed={onSheetDismissed}
        onChoose={choose}
      />
    ),
  };
}

function SourceRow({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: React.ReactNode; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: pressed ? theme.colors.field : theme.colors.ground,
      })}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: theme.colors.fill,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>{title}</Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

/** Two sources, two short tips, Cancel. Skipping is still fine — Next works without a photo. */
export function PhotoSourceSheet({
  visible,
  onClose,
  onDismissed,
  onChoose,
}: {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  onChoose: (source: PhotoSource) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const tips = [t('onboarding.photo.tipFace'), t('onboarding.photo.tipNoGroup')];

  return (
    <BottomSheet visible={visible} onClose={onClose} onDismissed={onDismissed}>
      <View style={{ gap: 10 }}>
        <View style={{ gap: 4, paddingHorizontal: 4, paddingBottom: 4 }}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 24, letterSpacing: -0.5, color: theme.colors.textPrimary }}>
            {t('onboarding.photo.sheetTitle')}
          </Text>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>
            {t('onboarding.photo.sheetSubtitle')}
          </Text>
        </View>
        <SourceRow
          title={t('onboarding.photo.takePhoto')}
          subtitle={t('onboarding.photo.takePhotoHint')}
          icon={<CameraGlyph color={theme.colors.onFill} />}
          onPress={() => onChoose('camera')}
        />
        <SourceRow
          title={t('onboarding.photo.chooseLibrary')}
          subtitle={t('onboarding.photo.chooseLibraryHint')}
          icon={<LibraryGlyph color={theme.colors.onFill} />}
          onPress={() => onChoose('library')}
        />
        <View style={{ gap: 8, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4 }}>
          {tips.map((tip) => (
            <View key={tip} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CheckBadge size={18} />
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{tip}</Text>
            </View>
          ))}
        </View>
        <TextPillAction label={t('common.cancel')} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
