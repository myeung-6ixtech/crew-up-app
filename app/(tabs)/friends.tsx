import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CircleButton,
  PersonPlusGlyph,
  PersonRow,
  RowChevron,
  SmallPillButton,
  TabTitle,
} from '@/components/crew/kit';
import { personName, personRoleBase, type PersonProfile } from '@/components/crew/people';
import { FriendsTabSkeleton } from '@/components/friends/FriendsTabSkeleton';
import { Screen, Toast } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { PillCta } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { blockUser, fetchConnections, updateConnectionStatus } from '@/services/connectionService';
import { fontFamily, useTheme } from '@/theme';

type Connection = {
  id: string;
  status: string;
  requester_id: string;
  addressee_id: string;
  requester?: { profile?: PersonProfile };
  addressee?: { profile?: PersonProfile };
};

/** Requests show only when someone asked. Accept moves them into Your friends; Decline blocks — heavier than a no. */
export default function FriendsTab() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const tabScroll = useTabBarScroll({ contentContainerStyle: { paddingHorizontal: 24 } });
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setConnections(await fetchConnections(client, userId));
  }, [client, userId]);

  useEffect(() => {
    let cancelled = false;
    void load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const other = (c: Connection) => (c.requester_id === userId ? c.addressee?.profile : c.requester?.profile);
  const otherId = (c: Connection) => (c.requester_id === userId ? c.addressee_id : c.requester_id);

  const pending = useMemo(
    () => connections.filter((c) => c.status === 'pending' && c.addressee_id === userId),
    [connections, userId],
  );
  const friends = useMemo(() => connections.filter((c) => c.status === 'accepted'), [connections]);

  const respond = async (c: Connection, accept: boolean) => {
    setBusyId(c.id);
    try {
      if (accept) await updateConnectionStatus(client, c.id, 'accepted');
      else await blockUser(client, c.requester_id);
      await load();
      if (accept) {
        hapticSuccess();
        setToast(t('friends.nowFriends', { name: personName(other(c), t('home.crewMember')).split(' ')[0] }));
      }
    } catch {
      hapticError();
      setToast(t('onboarding.genericError'));
    } finally {
      setBusyId(null);
    }
  };

  const openAdd = () => router.push(SCREENS.friends.add);

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <TabTitle
          title={t('tabs.friends')}
          subtitle={t('friends.subtitle')}
          right={
            <CircleButton accessibilityLabel={t('friends.addFriend')} onPress={openAdd}>
              <PersonPlusGlyph color={theme.colors.textPrimary} />
            </CircleButton>
          }
        />
      </View>
      {loading ? (
        <FriendsTabSkeleton />
      ) : (
        <ScrollView
          {...tabScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await load();
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }>
          {pending.length ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 22 }}>
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>
                  {t('friends.requests')}
                </Text>
                <Text
                  style={{
                    fontFamily: fontFamily.monoMedium,
                    fontSize: 11,
                    color: theme.colors.onFill,
                    backgroundColor: theme.colors.fill,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 9,
                    overflow: 'hidden',
                  }}>
                  {pending.length}
                </Text>
              </View>
              <View style={{ gap: 8, marginTop: 10 }}>
                {pending.map((c) => {
                  const person = other(c);
                  return (
                    <View key={c.id} style={{ backgroundColor: theme.colors.card, borderRadius: 18, paddingTop: 4, paddingHorizontal: 14, paddingBottom: 14 }}>
                      <PersonRow
                        name={personName(person, t('home.crewMember'))}
                        subtitle={personRoleBase(person, t)}
                        fileId={person?.avatar_file_id}
                        seed={c.requester_id}
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <SmallPillButton
                          style={{ flex: 1 }}
                          tone="lime"
                          label={t('network.accept')}
                          loading={busyId === c.id}
                          onPress={() => void respond(c, true)}
                        />
                        <SmallPillButton
                          style={{ flex: 1 }}
                          label={t('network.decline')}
                          disabled={busyId === c.id}
                          onPress={() => void respond(c, false)}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary, marginTop: 24 }}>
            {t('friends.yourFriends')}
          </Text>
          {friends.length ? (
            <View style={{ marginTop: 2 }}>
              {friends.map((c) => {
                const person = other(c);
                return (
                  <PersonRow
                    key={c.id}
                    divider
                    name={personName(person, t('home.crewMember'))}
                    subtitle={personRoleBase(person, t)}
                    fileId={person?.avatar_file_id}
                    seed={otherId(c)}
                    onPress={() => router.push(SCREENS.network.user(otherId(c)))}
                    trailing={<RowChevron color={theme.colors.textTertiary} />}
                  />
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>
                {t('friends.emptyTitle')}
              </Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 }}>
                {t('friends.emptyBody')}
              </Text>
              <View style={{ alignSelf: 'stretch' }}>
                <PillCta label={t('friends.addNewFriend')} onPress={openAdd} />
              </View>
            </View>
          )}
        </ScrollView>
      )}
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
    </Screen>
  );
}
