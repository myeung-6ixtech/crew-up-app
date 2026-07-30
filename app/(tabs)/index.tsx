import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Card, Title, Subtitle, Button, EmptyState, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchHomeData } from '@/services/presenceService';
import { SCREENS } from '@/constants/screens';
import { formatDateRange } from '@/lib/utils';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId, isVerified } = useAuth();
  const [data, setData] = useState<{
    rosters?: { id: string; layover_city?: string; layover_start?: string; layover_end?: string }[];
    presence?: { id: string; city: string; user?: { profile?: { display_name?: string; role_type?: string } } }[];
    events?: { id: string; title: string; city: string; starts_at: string }[];
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const result = await fetchHomeData(client, userId);
    setData(result as typeof data);
  }, [client, userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isVerified) {
    return (
      <Screen>
        <Title>{t('verification.pending')}</Title>
        <Subtitle>{t('verification.pendingBody')}</Subtitle>
        <Button label={t('verification.uploadId')} onPress={() => router.push(SCREENS.onboarding.verification)} />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Title>{t('home.layovers')}</Title>
        {data?.rosters?.length ? (
          data.rosters.map((r) => (
            <Card key={r.id}>
              <Text style={{ fontWeight: '600' }}>{r.layover_city}</Text>
              <Text>{formatDateRange(r.layover_start ?? '', r.layover_end)}</Text>
            </Card>
          ))
        ) : (
          <EmptyState title={t('home.emptyRoster')} />
        )}
        <Button label={t('roster.upload')} onPress={() => router.push(SCREENS.roster.upload)} variant="secondary" />

        <Title>{t('home.whosAround')}</Title>
        {data?.presence?.slice(0, 8).map((p) => (
          <Pressable key={p.id} onPress={() => router.push(SCREENS.presence(p.city))}>
            <Card>
              <Text style={{ fontWeight: '600' }}>{p.city}</Text>
              <Text>{p.user?.profile?.display_name ?? 'Crew member'}</Text>
              {p.user?.profile?.role_type ? <Badge label={p.user.profile.role_type} /> : null}
            </Card>
          </Pressable>
        ))}

        <Title>{t('home.suggestedEvents')}</Title>
        {data?.events?.map((e) => (
          <Pressable key={e.id} onPress={() => router.push(SCREENS.events.detail(e.id))}>
            <Card>
              <Text style={{ fontWeight: '600' }}>{e.title}</Text>
              <Text>{e.city} · {new Date(e.starts_at).toLocaleString()}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
