import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Card, Input, Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { discoverProfiles, fetchBlocks, requestConnection } from '@/services/connectionService';
import { SCREENS } from '@/constants/screens';

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [base, setBase] = useState('');
  const [role, setRole] = useState('');
  const [profiles, setProfiles] = useState<
    { user_id: string; display_name: string; role_type?: string; base_airport?: string }[]
  >([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const blocks = await fetchBlocks(client, userId);
    const blockedIds = blocks.map((b: { blocked_id: string }) => b.blocked_id);
    const result = await discoverProfiles(client, {
      baseAirport: base || undefined,
      roleType: role || undefined,
      excludeUserIds: [userId, ...blockedIds],
    });
    setProfiles(result);
  }, [base, client, role, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{t('network.discover')}</Title>
        <Input label="Base airport" value={base} onChangeText={setBase} placeholder="HKG" />
        <Input label="Role" value={role} onChangeText={setRole} placeholder="cabin_crew" />
        <Button label="Search" onPress={load} />
        {profiles.length === 0 ? (
          <EmptyState title="No crew found" />
        ) : (
          profiles.map((p) => (
            <Card key={p.user_id}>
              <Pressable onPress={() => router.push(SCREENS.network.user(p.user_id))}>
                <Text style={{ fontWeight: '600' }}>{p.display_name}</Text>
                <Text>{[p.role_type, p.base_airport].filter(Boolean).join(' · ')}</Text>
              </Pressable>
              <Button
                label={t('network.connect')}
                variant="secondary"
                onPress={async () => {
                  await requestConnection(client, p.user_id);
                }}
              />
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
