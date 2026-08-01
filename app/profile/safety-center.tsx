import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Card, BodyText } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchBlocks } from '@/services/safetyService';
import { useThemedStyles } from '@/theme';

export default function SafetyCenterScreen() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { userId } = useAuth();
  const styles = useThemedStyles((t) => ({ content: { padding: t.spacing.lg } }));
  const [blocks, setBlocks] = useState<
    { id: string; blocked_id: string; blocked?: { profile?: { display_name?: string } } }[]
  >([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setBlocks(await fetchBlocks(client, userId));
  }, [client, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>{t('safety.safetyCenter')}</Title>
        <BodyText muted style={{ marginBottom: 16 }}>
          Report harassment or spam from profiles, chats, or events. Blocked users are hidden from discover.
        </BodyText>
        <Title>Blocked users</Title>
        {blocks.map((b) => (
          <Card key={b.id}>
            <BodyText strong>{b.blocked?.profile?.display_name ?? b.blocked_id}</BodyText>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
