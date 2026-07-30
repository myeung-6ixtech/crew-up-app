import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Card, Title, Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchConnections } from '@/services/connectionService';
import { SCREENS } from '@/constants/screens';

export default function NetworkTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId, isVerified } = useAuth();
  const [connections, setConnections] = useState<
    { id: string; status: string; requester?: { profile?: { display_name?: string } }; addressee?: { profile?: { display_name?: string } } }[]
  >([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setConnections(await fetchConnections(client, userId));
  }, [client, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isVerified) {
    return (
      <Screen>
        <EmptyState title={t('verification.pending')} body={t('verification.pendingBody')} />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Button label={t('network.discover')} onPress={() => router.push(SCREENS.network.discover)} />
        <Button
          label={t('network.connections')}
          onPress={() => router.push(SCREENS.network.connections)}
          variant="secondary"
        />
        <Title>{t('network.connections')}</Title>
        {connections.length === 0 ? (
          <EmptyState title="No connections yet" body="Discover crew at your base or on layover." />
        ) : (
          connections.slice(0, 5).map((c: { id: string; status: string; requester?: { profile?: { display_name?: string } }; addressee?: { profile?: { display_name?: string } } }) => (
            <Card key={c.id}>
              <Text>{c.requester?.profile?.display_name ?? c.addressee?.profile?.display_name}</Text>
              <Text>{c.status}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
