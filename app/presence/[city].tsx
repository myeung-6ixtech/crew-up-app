import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Card, EmptyState, Badge } from '@/components/ui';
import { fetchPresenceByCity } from '@/services/presenceService';

export default function PresenceCityScreen() {
  const { city } = useLocalSearchParams<{ city: string }>();
  const client = useApolloClient();
  const [crew, setCrew] = useState<
    { id: string; user?: { profile?: { display_name?: string; role_type?: string; base_airport?: string; is_verified?: boolean } } }[]
  >([]);

  const load = useCallback(async () => {
    if (!city) return;
    setCrew(await fetchPresenceByCity(client, decodeURIComponent(city)));
  }, [client, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{decodeURIComponent(city ?? '')}</Title>
        {crew.length === 0 ? (
          <EmptyState title="No crew visible here yet" body="Presence updates after roster uploads and privacy settings." />
        ) : (
          crew.map((p) => (
            <Card key={p.id}>
              <Text style={{ fontWeight: '600' }}>{p.user?.profile?.display_name ?? 'Crew'}</Text>
              <Text>{[p.user?.profile?.role_type, p.user?.profile?.base_airport].filter(Boolean).join(' · ')}</Text>
              {p.user?.profile?.is_verified ? <Badge label="Verified" tone="verified" /> : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
