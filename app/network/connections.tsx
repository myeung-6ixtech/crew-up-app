import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Card, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchConnections, updateConnectionStatus, blockUser } from '@/services/connectionService';
import { SCREENS } from '@/constants/screens';

type Connection = {
  id: string;
  status: string;
  requester_id: string;
  addressee_id: string;
  requester?: { profile?: { display_name?: string } };
  addressee?: { profile?: { display_name?: string } };
};

export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setConnections(await fetchConnections(client, userId));
  }, [client, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const nameFor = (c: Connection) => {
    if (c.requester_id === userId) return c.addressee?.profile?.display_name;
    return c.requester?.profile?.display_name;
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{t('network.connections')}</Title>
        {connections.map((c) => (
          <Card key={c.id}>
            <Text style={{ fontWeight: '600' }}>{nameFor(c)}</Text>
            <Text>{c.status}</Text>
            {c.status === 'pending' && c.addressee_id === userId ? (
              <>
                <Button label={t('network.accept')} onPress={async () => { await updateConnectionStatus(client, c.id, 'accepted'); await load(); }} />
                <Button label={t('network.decline')} variant="secondary" onPress={async () => { await blockUser(client, c.requester_id); await load(); }} />
              </>
            ) : null}
            <Button
              label="View profile"
              variant="secondary"
              onPress={() =>
                router.push(
                  SCREENS.network.user(c.requester_id === userId ? c.addressee_id : c.requester_id),
                )
              }
            />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
