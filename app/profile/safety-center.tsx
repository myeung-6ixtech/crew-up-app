import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Card, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { blockUser, fetchBlocks } from '@/services/safetyService';

export default function SafetyCenterScreen() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { userId } = useAuth();
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
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{t('safety.safetyCenter')}</Title>
        <Text style={{ marginBottom: 16, color: '#64748B' }}>
          Report harassment or spam from profiles, chats, or events. Blocked users are hidden from discover.
        </Text>
        <Title>Blocked users</Title>
        {blocks.map((b) => (
          <Card key={b.id}>
            <Text>{b.blocked?.profile?.display_name ?? b.blocked_id}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
