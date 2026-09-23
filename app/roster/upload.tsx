import { useState } from 'react';
import { Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatApolloError, graphQLErrorCode } from '@/lib/graphqlError';
import { Screen, Title, Subtitle, Button, BodySmText } from '@/components/ui';
import { uploadAndParseRoster } from '@/services/rosterService';
import { useRosterDraftStore } from '@/stores/rosterDraftStore';
import { SCREENS } from '@/constants/screens';
import { useTheme } from '@/theme';

const ROSTER_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/webp'];

export default function RosterUploadScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const setDraft = useRosterDraftStore((s) => s.setDraft);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const describeError = (e: unknown) => {
    const code = graphQLErrorCode(e);
    const key = `roster.errors.${code}`;
    return code && i18n.exists(key) ? t(key) : formatApolloError(e);
  };

  const pickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ROSTER_FILE_TYPES });
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
        setError(t('roster.errors.noLayovers'));
        return;
      }
      setDraft(fileId, parsed.entries);
      router.push(SCREENS.roster.confirm);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>{t('roster.uploadTitle')}</Title>
      <Subtitle>{t('roster.uploadBody')}</Subtitle>
      <BodySmText muted style={{ marginBottom: theme.spacing.md }}>
        {t('roster.uploadPrivacy')}
      </BodySmText>
      {error ? <Text style={{ color: theme.colors.statusOnDuty, marginBottom: 8 }}>{error}</Text> : null}
      <Button
        label={loading ? t('roster.reading') : t('roster.chooseFile')}
        onPress={pickFile}
        loading={loading}
      />
      <Button label={t('roster.manual')} onPress={() => router.push(SCREENS.roster.confirm)} variant="secondary" />
    </Screen>
  );
}
