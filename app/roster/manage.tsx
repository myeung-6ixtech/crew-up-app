import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Card, Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { deleteRoster, fetchMyRosters } from '@/services/rosterService';
import type { RosterEntry } from '@/types/domain';
import { formatDateRange } from '@/lib/utils';
import { SCREENS } from '@/constants/screens';

export default function RosterManageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [rosters, setRosters] = useState<RosterEntry[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setRosters(await fetchMyRosters(client, userId));
  }, [client, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{t('roster.manage')}</Title>
        <Button label={t('roster.upload')} onPress={() => router.push(SCREENS.roster.upload)} />
        {rosters.length === 0 ? (
          <EmptyState title="No layovers saved" />
        ) : (
          rosters.map((r) => (
            <Card key={r.id}>
              <Text style={{ fontWeight: '600' }}>{r.layover_city}</Text>
              <Text>{formatDateRange(r.layover_start ?? '', r.layover_end)}</Text>
              {r.id ? (
                <Button
                  label="Delete"
                  variant="danger"
                  onPress={async () => {
                    await deleteRoster(client, r.id!);
                    await load();
                  }}
                />
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
