import { useState } from 'react';
import { Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Subtitle, Button } from '@/components/ui';
import { uploadAndParseRoster } from '@/services/rosterService';
import { useRosterDraftStore } from '@/stores/rosterDraftStore';
import { SCREENS } from '@/constants/screens';

export default function RosterUploadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const setDraft = useRosterDraftStore((s) => s.setDraft);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (picked.canceled || !picked.assets[0]) return;
    setLoading(true);
    setError('');
    try {
      const asset = picked.assets[0];
      const { fileId, parsed } = await uploadAndParseRoster(client, {
        uri: asset.uri,
        name: asset.name ?? 'roster',
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });
      if (!parsed?.entries?.length) {
        setError('No layovers detected. Try manual entry.');
        return;
      }
      setDraft(fileId, parsed.entries);
      router.push(SCREENS.roster.confirm);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>{t('roster.upload')}</Title>
      <Subtitle>Upload a roster PDF or screenshot from your airline app. Parsing runs via the secure CrewUp backend.</Subtitle>
      {error ? <Text style={{ color: '#DC2626', marginBottom: 8 }}>{error}</Text> : null}
      <Button label="Choose file" onPress={pickFile} loading={loading} />
      <Button label={t('roster.manual')} onPress={() => router.push(SCREENS.roster.confirm)} variant="secondary" />
    </Screen>
  );
}
