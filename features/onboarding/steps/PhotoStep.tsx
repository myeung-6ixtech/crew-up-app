import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Avatar, BodyText, Button } from '@/components/ui';
import { STORAGE_BUCKETS } from '@/constants/storage';
import { useAuth } from '@/hooks/useSession';
import { uploadFile } from '@/services/uploadService';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { StepScaffold } from '../components/StepScaffold';
import { useStepSave } from '../hooks/useStepForm';
import type { StepContext } from '../navigation';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export type PhotoSource = 'camera' | 'library';

/**
 * Takes or picks a photo, lets the person move and scale it in the system square crop,
 * then uploads it straight to Nhost Storage with the user's session.
 */
export async function pickAndUploadAvatar(
  source: PhotoSource = 'library',
  onUploadStart?: (uri: string) => void,
): Promise<
  | { status: 'uploaded'; fileId: string; uri: string }
  | { status: 'cancelled' }
  | { status: 'too_large' }
  | { status: 'no_permission' }
> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  };
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'no_permission' };
  }
  const picked =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ ...options, cameraType: ImagePicker.CameraType.front })
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = picked.canceled ? null : picked.assets[0];
  if (!asset) return { status: 'cancelled' };
  if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) return { status: 'too_large' };
  onUploadStart?.(asset.uri);
  const fileId = await uploadFile({
    uri: asset.uri,
    name: 'avatar.jpg',
    mimeType: asset.mimeType ?? 'image/jpeg',
    bucketId: STORAGE_BUCKETS.avatars,
  });
  return { status: 'uploaded', fileId, uri: asset.uri };
}

export function PhotoStep({ context }: { context: StepContext }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { profile } = useAuth();
  const { save, saving, formError, setFormError } = useStepSave('photo', context);
  const [fileId, setFileId] = useState<string | null>(profile?.avatar_file_id ?? null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const skipped = useRef(false);

  useEffect(() => {
    if (context !== 'flow' || skipped.current) return;
    skipped.current = true;
    void save({});
  }, [context, save]);

  const onPick = async () => {
    setFormError('');
    setUploading(true);
    try {
      const result = await pickAndUploadAvatar();
      if (result.status === 'too_large') {
        hapticError();
        setFormError(t('onboarding.photo.tooLarge'));
      }
      if (result.status === 'uploaded') {
        hapticSuccess();
        setFileId(result.fileId);
        setPreviewUri(result.uri);
      }
    } catch {
      hapticError();
      setFormError(t('onboarding.genericError'));
    } finally {
      setUploading(false);
    }
  };

  const changed = fileId !== (profile?.avatar_file_id ?? null);

  if (context === 'flow') {
    if (!formError) return null;
    return (
      <StepScaffold
        step="photo"
        context={context}
        title={t('onboarding.photo.title')}
        primaryLabel={t('onboarding.next')}
        onPrimary={() => void save({})}
        primaryLoading={saving}
        error={formError}>
        <View />
      </StepScaffold>
    );
  }

  return (
    <StepScaffold
      step="photo"
      context={context}
      title={t('onboarding.photo.title')}
      subtitle={t('onboarding.photo.subtitle')}
      primaryLabel={t('onboarding.save')}
      onPrimary={() => void save(changed ? { avatarFileId: fileId } : {})}
      primaryLoading={saving}
      primaryDisabled={uploading}
      error={formError}>
      <View style={{ alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
        <Avatar
          name={profile?.preferred_name ?? profile?.full_name ?? undefined}
          fileId={previewUri ? null : fileId}
          localUri={previewUri}
          size="xl"
        />
        {uploading ? <BodyText muted>{t('onboarding.photo.uploading')}</BodyText> : null}
        <Button
          label={fileId ? t('onboarding.photo.change') : t('onboarding.photo.choose')}
          onPress={() => void onPick()}
          variant="secondary"
          disabled={uploading}
        />
      </View>
    </StepScaffold>
  );
}
