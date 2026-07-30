import { useState } from 'react';
import { Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Subtitle, Button, Badge } from '@/components/ui';
import { uploadFile } from '@/services/uploadService';
import { submitVerification } from '@/services/profileService';
import { useAuth, useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';

export default function VerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { isVerified } = useAuth();
  const { refreshProfile } = useSession();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const uploadId = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (picked.canceled || !picked.assets[0]) return;
    setLoading(true);
    try {
      const asset = picked.assets[0];
      const fileId = await uploadFile({
        uri: asset.uri,
        name: asset.name ?? 'crew-id',
        mimeType: asset.mimeType ?? 'application/octet-stream',
        bucketId: 'verification-docs',
      });
      await submitVerification(client, fileId);
      setStatus('Submitted for review.');
      await refreshProfile();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Screen>
        <Badge label={t('verification.verified')} tone="success" />
        <Subtitle>You have full access to CrewUp.</Subtitle>
        <Button label="Continue" onPress={() => router.replace(SCREENS.onboarding.rosterIntro)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{t('verification.pending')}</Title>
      <Subtitle>{t('verification.pendingBody')}</Subtitle>
      <Button label={t('verification.uploadId')} onPress={uploadId} loading={loading} />
      {status ? <Text style={{ marginTop: 12 }}>{status}</Text> : null}
      <Button
        label="Skip to home (limited)"
        onPress={() => router.replace(SCREENS.tabs.home)}
        variant="secondary"
      />
    </Screen>
  );
}
