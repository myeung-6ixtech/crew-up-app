import { useState } from 'react';
import { ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Input, Button } from '@/components/ui';
import { useAuth, useSession } from '@/hooks/useSession';
import { updateProfile } from '@/services/profileService';
import { uploadFile } from '@/services/uploadService';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { profile, userId } = useAuth();
  const { refreshProfile } = useSession();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [base, setBase] = useState(profile?.base_airport ?? '');
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await updateProfile(client, userId, {
        display_name: displayName.trim(),
        base_airport: base.trim().toUpperCase(),
      });
      await refreshProfile();
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onAvatar = async () => {
    if (!userId) return;
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    const fileId = await uploadFile({
      uri: asset.uri,
      name: 'avatar.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      bucketId: 'avatars',
    });
    await updateProfile(client, userId, { avatar_file_id: fileId });
    await refreshProfile();
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>Edit profile</Title>
        <Input label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Input label="Base airport" value={base} onChangeText={setBase} />
        <Button label="Upload avatar" onPress={onAvatar} variant="secondary" />
        <Button label={t('common.save')} onPress={onSave} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
