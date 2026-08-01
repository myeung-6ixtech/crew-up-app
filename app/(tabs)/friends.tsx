import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import {
  Screen,
  Card,
  Title,
  Subtitle,
  Button,
  EmptyState,
  SectionLabel,
  BodyText,
} from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { fetchConnections, updateConnectionStatus, blockUser } from '@/services/connectionService';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles } from '@/theme';

type Connection = {
  id: string;
  status: string;
  requester_id: string;
  addressee_id: string;
  requester?: { profile?: { display_name?: string; role_type?: string; base_airport?: string } };
  addressee?: { profile?: { display_name?: string; role_type?: string; base_airport?: string } };
};

export default function FriendsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl },
  }));
  const [connections, setConnections] = useState<Connection[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setConnections(await fetchConnections(client, userId));
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

  const nameFor = (c: Connection) => {
    if (c.requester_id === userId) return c.addressee?.profile?.display_name;
    return c.requester?.profile?.display_name;
  };

  const profileFor = (c: Connection) =>
    c.requester_id === userId ? c.addressee?.profile : c.requester?.profile;

  const userIdFor = (c: Connection) =>
    c.requester_id === userId ? c.addressee_id : c.requester_id;

  const pending = useMemo(
    () => connections.filter((c) => c.status === 'pending' && c.addressee_id === userId),
    [connections, userId],
  );

  const friends = useMemo(
    () => connections.filter((c) => c.status === 'accepted'),
    [connections],
  );

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Title>{t('tabs.friends')}</Title>
        <Subtitle>{t('friends.subtitle')}</Subtitle>

        <Button label={t('network.discover')} onPress={() => router.push(SCREENS.network.discover)} />
        <Button
          label={t('network.connections')}
          onPress={() => router.push(SCREENS.network.connections)}
          variant="secondary"
        />

        {pending.length > 0 ? (
          <>
            <SectionLabel>{t('friends.requests')}</SectionLabel>
            {pending.map((c) => (
              <Card key={c.id}>
                <BodyText strong>{nameFor(c)}</BodyText>
                <BodyText muted>
                  {[profileFor(c)?.role_type, profileFor(c)?.base_airport].filter(Boolean).join(' · ')}
                </BodyText>
                <Button
                  label={t('network.accept')}
                  onPress={async () => {
                    await updateConnectionStatus(client, c.id, 'accepted');
                    await load();
                  }}
                />
                <Button
                  label={t('network.decline')}
                  variant="secondary"
                  onPress={async () => {
                    await blockUser(client, c.requester_id);
                    await load();
                  }}
                />
              </Card>
            ))}
          </>
        ) : null}

        <SectionLabel>{t('friends.yourFriends')}</SectionLabel>
        {friends.length === 0 ? (
          <EmptyState title={t('friends.emptyTitle')} body={t('friends.emptyBody')} />
        ) : (
          friends.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(SCREENS.network.user(userIdFor(c)))}>
              <Card>
                <BodyText strong>{nameFor(c)}</BodyText>
                <BodyText muted>
                  {[profileFor(c)?.role_type, profileFor(c)?.base_airport].filter(Boolean).join(' · ')}
                </BodyText>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
