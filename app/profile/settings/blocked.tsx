import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CrewAvatar } from '@/components/crew/kit';
import { SettingsPage } from '@/components/settings/settingsKit';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticSuccess } from '@/lib/haptics';
import { fetchBlockedPeople, unblockUser, type BlockedPerson } from '@/services/connectionService';
import { fontFamily, useTheme } from '@/theme';

/** Blocked people, newest first, each with Unblock. Unblocking doesn't restore a friendship or old requests. */
export default function BlockedPeopleScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const client = useApolloClient();
  const [people, setPeople] = useState<BlockedPerson[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setPeople(await fetchBlockedPeople());
    } catch {
      setError(t('blocked.loadFailed'));
      setPeople([]);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmUnblock = (person: BlockedPerson) => {
    const name = person.name ?? t('blocked.someone');
    Alert.alert(t('blocked.unblockTitle', { name }), t('blocked.unblockBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('blocked.unblock'),
        onPress: async () => {
          setBusyId(person.id);
          try {
            await unblockUser(client, person.id);
            hapticSuccess();
            setPeople((current) => current?.filter((item) => item.id !== person.id) ?? null);
          } catch {
            setError(t('onboarding.genericError'));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <SettingsPage title={t('blocked.title')} subtitle={t('blocked.intro')}>
      {people === null ? <ActivityIndicator color={theme.colors.accentText} /> : null}
      {people && !people.length && !error ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>{t('blocked.empty')}</Text>
      ) : null}
      {people?.length ? (
        <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, overflow: 'hidden' }}>
          {people.map((person, index) => (
            <View
              key={person.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.hairline,
              }}>
              <CrewAvatar size={40} name={person.name ?? '?'} fileId={person.avatarFileId} seed={person.userId} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
                  {person.name ?? t('blocked.someone')}
                </Text>
                {person.username ? (
                  <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
                    @{person.username}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('blocked.unblock')} ${person.name ?? ''}`.trim()}
                disabled={busyId === person.id}
                onPress={() => confirmUnblock(person)}
                style={({ pressed }) => ({
                  height: 34,
                  paddingHorizontal: 14,
                  borderRadius: 17,
                  borderWidth: 1.5,
                  borderColor: theme.colors.track,
                  justifyContent: 'center',
                  opacity: pressed || busyId === person.id ? 0.6 : 1,
                })}>
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.textPrimary }}>{t('blocked.unblock')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {error ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty }}>{error}</Text> : null}
    </SettingsPage>
  );
}
